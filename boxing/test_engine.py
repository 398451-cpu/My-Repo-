import json
import unittest

from boxing.engine import Boxer, BoxingError, Fight, command


class BoxerTests(unittest.TestCase):
    def test_flat_footed_threshold_and_halving(self):
        attacker = Boxer("A", max_stamina=30, current_stamina=20, punch_power=14, punch_speed=14)
        target = Boxer("B")
        normal = attacker.throw_punch(target, "jab")
        self.assertFalse(attacker.is_flat_footed)
        attacker.current_stamina = 20
        attacker._clamp()
        target.current_health = target.max_health
        attacker.current_stamina = 17
        attacker._clamp()
        target.current_health = target.max_health
        flat = attacker.throw_punch(target, "jab")
        self.assertTrue(attacker.is_flat_footed)
        self.assertEqual(flat["damage"], normal["damage"] // 2)
        self.assertEqual(flat["speed"], normal["speed"] / 2)

    def test_costs_bounds_and_invalid(self):
        boxer = Boxer("A", max_stamina=10, current_stamina=7)
        with self.assertRaises(BoxingError):
            boxer.throw_punch(Boxer("B"), "uppercut")
        with self.assertRaises(BoxingError):
            boxer.throw_punch(Boxer("B"), "hook", True)
        self.assertGreaterEqual(boxer.current_health, 0)


class FightTests(unittest.TestCase):
    def test_round_transition_and_terminal_reward_only_once(self):
        fight = Fight(Boxer("A", punch_power=14, punch_speed=14),
                      Boxer("B", punch_power=14, punch_speed=14))
        for _ in range(6):
            fight.take_turn("guard")
        self.assertEqual(fight.round, 2)
        self.assertEqual(fight.turn_in_round, 0)
        fight.player.current_health = 100
        fight.opponent.current_health = 1
        fight.opponent.max_stamina = 0
        fight.opponent.current_stamina = 0
        fight.take_turn("jab")
        self.assertEqual(fight.status, "win")
        self.assertEqual(fight.reward, 500)
        with self.assertRaisesRegex(BoxingError, "already finished"):
            fight.take_turn("jab")
        self.assertEqual(fight.reward, 500)  # no second purse is paid

    def test_serialized_commands_and_validation(self):
        bad = command({"action": "create_fighter", "name": "A", "punch_power": 14, "punch_speed": 14})
        self.assertFalse(bad["ok"])
        made = command({"action": "create_fighter", "name": "Nova", "punch_power": 15, "punch_speed": 13})
        self.assertTrue(made["ok"])
        started = command({"action": "start_fight", "fighter": made["fighter"]})
        self.assertTrue(started["ok"])
        moved = command({"action": "take_turn", "fight": started["fight"], "player_action": "jab"})
        self.assertTrue(moved["ok"])
        json.dumps(moved)

    def test_new_fight_restores_health_and_stamina(self):
        fighter = Boxer("Nova", current_health=0, current_stamina=2).to_dto()
        started = command({"action": "start_fight", "fighter": fighter})
        self.assertTrue(started["ok"])
        self.assertEqual(started["fight"]["player"]["current_health"], 100)
        self.assertEqual(started["fight"]["player"]["current_stamina"], 30)


if __name__ == "__main__":
    unittest.main()