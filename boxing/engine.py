"""Small, dependency-free domain model and JSON command bridge for the boxing game.

Run the bridge with ``python3 boxing/engine.py`` and send one JSON object per
line on stdin.  Keeping the rules here (rather than in a UI) makes the model
usable by a terminal client, a web client, or tests.
"""

from __future__ import annotations

import json
import sys
import uuid
from dataclasses import dataclass, field
from typing import Any


PUNCHES = {
    "jab": {"stamina": 3, "damage": 0.72, "speed": 1.22},
    "cross": {"stamina": 5, "damage": 1.00, "speed": 0.96},
    "hook": {"stamina": 6, "damage": 1.18, "speed": 0.78},
}
POWER_COST = 3
POWER_BOOST = 1.35
FLAT_FOOTED_THRESHOLD = 15


class BoxingError(ValueError):
    """An expected, user-correctable game or command error."""


@dataclass
class Boxer:
    name: str
    max_health: int = 100
    current_health: int | None = None
    max_stamina: int = 30
    current_stamina: int | None = None
    punch_power: int = 14
    punch_speed: int = 14
    is_flat_footed: bool = field(init=False)

    def __post_init__(self) -> None:
        self.current_health = self.max_health if self.current_health is None else self.current_health
        self.current_stamina = self.max_stamina if self.current_stamina is None else self.current_stamina
        self._clamp()

    def _clamp(self) -> None:
        self.max_health = max(1, int(self.max_health))
        self.max_stamina = max(0, int(self.max_stamina))
        self.current_health = max(0, min(self.max_health, int(self.current_health)))
        self.current_stamina = max(0, min(self.max_stamina, int(self.current_stamina)))
        self.is_flat_footed = self.current_stamina < FLAT_FOOTED_THRESHOLD

    def _spend_stamina(self, amount: int) -> None:
        if self.current_stamina < amount:
            raise BoxingError(
                f"{self.name} needs {amount} stamina but has {self.current_stamina}"
            )
        self.current_stamina -= amount
        self._clamp()

    def take_damage(self, amount: int) -> int:
        damage = max(0, int(amount))
        before = self.current_health
        self.current_health = max(0, self.current_health - damage)
        return before - self.current_health

    def recover(self, amount: int = 6) -> int:
        before = self.current_stamina
        self.current_stamina = min(self.max_stamina, self.current_stamina + max(0, amount))
        self._clamp()
        return self.current_stamina - before

    def throw_punch(
        self, target: "Boxer", punch_type: str, power_modifier: bool = False
    ) -> dict[str, Any]:
        punch_type = str(punch_type).lower()
        if punch_type not in PUNCHES:
            raise BoxingError("Invalid punch type. Choose jab, cross, or hook.")
        spec = PUNCHES[punch_type]
        cost = spec["stamina"] + (POWER_COST if power_modifier else 0)
        self._spend_stamina(cost)
        # Flat-footedness is evaluated after paying the cost, intentionally.
        flat = self.is_flat_footed
        speed = self.punch_speed * spec["speed"] * (0.5 if flat else 1)
        damage = self.punch_power * spec["damage"] * (POWER_BOOST if power_modifier else 1)
        if flat:
            damage *= 0.5
        dealt = target.take_damage(max(0, round(damage)))
        return {
            "punch_type": punch_type,
            "stamina_cost": cost,
            "speed": round(speed, 2),
            "damage": dealt,
            "flat_footed": flat,
            "power_modifier": bool(power_modifier),
        }

    def to_dto(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "max_health": self.max_health,
            "current_health": self.current_health,
            "max_stamina": self.max_stamina,
            "current_stamina": self.current_stamina,
            "punch_power": self.punch_power,
            "punch_speed": self.punch_speed,
            "is_flat_footed": self.is_flat_footed,
        }

    @classmethod
    def from_dto(cls, value: dict[str, Any]) -> "Boxer":
        fields = ("name", "max_health", "current_health", "max_stamina",
                  "current_stamina", "punch_power", "punch_speed")
        missing = [key for key in fields if key not in value]
        if missing:
            raise BoxingError(f"Fighter is missing: {', '.join(missing)}")
        return cls(**{key: value[key] for key in fields})


@dataclass
class Fight:
    player: Boxer
    opponent: Boxer
    fight_id: str = field(default_factory=lambda: uuid.uuid4().hex)
    round: int = 1
    turn_in_round: int = 0
    status: str = "active"
    logs: list[dict[str, Any]] = field(default_factory=list)
    last_action: str = ""
    reward: int = 0
    _guarding: bool = field(default=False, repr=False)

    def _log(self, text: str) -> None:
        self.logs.append({"turn": len(self.logs) + 1, "text": text})

    def _finish(self, status: str) -> None:
        if self.status != "active":
            return
        self.status = status
        self.reward = {"win": 500, "draw": 200, "loss": 75}[status]
        self._log(f"Fight over: {status.upper()}. Purse earned: ${self.reward}.")

    def _check_knockout(self) -> bool:
        if self.opponent.current_health <= 0:
            self._finish("win")
        elif self.player.current_health <= 0:
            self._finish("loss")
        return self.status != "active"

    def _opponent_response(self) -> None:
        if self.status != "active":
            return
        # A predictable CPU response keeps the text game tactical and testable.
        punch = "cross" if self.opponent.current_stamina >= 5 else "jab"
        try:
            result = self.opponent.throw_punch(self.player, punch)
            damage = result["damage"]
            if self._guarding:
                reduced = damage // 2
                self.player.current_health = min(
                    self.player.max_health, self.player.current_health + (damage - reduced)
                )
                damage = reduced
            self._log(
                f"{self.opponent.name} answered with a {punch}; "
                f"{damage} damage landed."
            )
        except BoxingError:
            restored = self.opponent.recover(6)
            self._log(f"{self.opponent.name} recovered {restored} stamina.")
        self._check_knockout()

    def take_turn(self, player_action: str, power_modifier: bool = False) -> None:
        if self.status != "active":
            raise BoxingError("This fight is already finished; no further purse is paid.")
        action = str(player_action).lower()
        self.last_action = action
        self._guarding = False
        if action in PUNCHES:
            result = self.player.throw_punch(self.opponent, action, power_modifier)
            boosted = " with extra power" if power_modifier else ""
            footed = " (flat-footed)" if result["flat_footed"] else ""
            self._log(
                f"You threw a {action}{boosted}{footed}: "
                f"{result['damage']} damage at speed {result['speed']}."
            )
        elif action == "guard":
            self._guarding = True
            self._log("You raised your guard. The next response deals half damage.")
        elif action == "recover":
            restored = self.player.recover(7)
            self._log(f"You recovered {restored} stamina.")
        else:
            raise BoxingError("Invalid action. Choose jab, cross, hook, guard, or recover.")
        if self._check_knockout():
            return
        self._opponent_response()
        if self.status != "active":
            return
        self.turn_in_round += 1
        self._guarding = False
        if self.turn_in_round >= 6:
            if self.round >= 3:
                if self.player.current_health > self.opponent.current_health:
                    self._finish("win")
                elif self.player.current_health < self.opponent.current_health:
                    self._finish("loss")
                else:
                    self._finish("draw")
            else:
                self.round += 1
                self.turn_in_round = 0
                self.player.recover(5)
                self.opponent.recover(5)
                self._log(f"Round {self.round - 1} ended. Both fighters regain composure.")

    def to_dto(self) -> dict[str, Any]:
        return {
            "fight_id": self.fight_id, "player": self.player.to_dto(),
            "opponent": self.opponent.to_dto(), "round": self.round,
            "turn_in_round": self.turn_in_round, "status": self.status,
            "logs": self.logs, "last_action": self.last_action, "reward": self.reward,
        }

    @classmethod
    def from_dto(cls, value: dict[str, Any]) -> "Fight":
        fight = cls(Boxer.from_dto(value["player"]), Boxer.from_dto(value["opponent"]),
                    fight_id=value["fight_id"], round=int(value["round"]),
                    turn_in_round=int(value["turn_in_round"]), status=value["status"],
                    logs=list(value.get("logs", [])), last_action=value.get("last_action", ""),
                    reward=int(value.get("reward", 0)))
        return fight


def validate_fighter(name: Any, punch_power: Any, punch_speed: Any) -> None:
    if not isinstance(name, str) or not 2 <= len(name.strip()) <= 24:
        raise BoxingError("Name must be between 2 and 24 characters.")
    if type(punch_power) is not int or type(punch_speed) is not int:
        raise BoxingError("Punch power and speed must be integers.")
    if not (6 <= punch_power <= 18 and 6 <= punch_speed <= 18):
        raise BoxingError("Punch power and speed must each be between 6 and 18.")
    if punch_power + punch_speed != 28:
        raise BoxingError("Punch power and speed must add up to exactly 28.")


def command(request: dict[str, Any]) -> dict[str, Any]:
    try:
        action = request.get("action")
        if action == "create_fighter":
            validate_fighter(request.get("name"), request.get("punch_power"), request.get("punch_speed"))
            fighter = Boxer(request["name"].strip(), punch_power=request["punch_power"],
                            punch_speed=request["punch_speed"])
            return {"ok": True, "fighter": fighter.to_dto()}
        if action == "start_fight":
            saved = Boxer.from_dto(request["fighter"])
            player = Boxer(
                saved.name,
                max_health=saved.max_health,
                max_stamina=saved.max_stamina,
                punch_power=saved.punch_power,
                punch_speed=saved.punch_speed,
            )
            opponent = Boxer("Rico Vale", punch_power=14, punch_speed=14)
            return {"ok": True, "fight": Fight(player, opponent).to_dto()}
        if action == "take_turn":
            fight = Fight.from_dto(request["fight"])
            fight.take_turn(request.get("player_action"), bool(request.get("power_modifier", False)))
            return {"ok": True, "fight": fight.to_dto()}
        raise BoxingError("Unknown action. Choose create_fighter, start_fight, or take_turn.")
    except (BoxingError, KeyError, TypeError, ValueError, AttributeError) as exc:
        return {"ok": False, "error": str(exc)}


# Friendly name for clients that want to embed the line-oriented bridge.
handle_command = command


def main() -> None:
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            request = json.loads(line)
            response = command(request)
        except json.JSONDecodeError as exc:
            response = {"ok": False, "error": f"Invalid JSON: {exc.msg}"}
        print(json.dumps(response), flush=True)


if __name__ == "__main__":
    main()