// Immutable pre-D165 price archive. Included in the implementation hash; never regenerate from current quotes.
export default {
  "source_commit": "a68ec19a5",
  "note": "Immutable pre-D165 schedules; reconstruct only when actual aggregate and version match exactly. Never use current quotes for refunds.",
  "roots": {
    "thief": {
      "cost_version": "thief-class2-v1",
      "skill_ids": [
        "assassin_sonic_blow",
        "assassin_enchant_poison",
        "assassin_venom_dust",
        "assassin_detonate",
        "assassin_grimtooth",
        "assassin_katar_mastery",
        "assassin_poison_edge",
        "rogue_strip_armor",
        "rogue_strip_weapon",
        "rogue_expose",
        "rogue_intimidate",
        "rogue_raid",
        "rogue_dodge",
        "rogue_dirty_tricks",
        "rogue_copy_swordsman_bash",
        "rogue_copy_acolyte_heal",
        "rogue_copy_archer_double_strafe",
        "rogue_copy_mage_fire_bolt",
        "rogue_copy_merchant_cart_revolution"
      ]
    },
    "swordsman": {
      "cost_version": "swordsman-class2-v1",
      "skill_ids": [
        "knight_pierce",
        "knight_twohand_quicken",
        "knight_brandish",
        "knight_battle_cry",
        "knight_counter_stance",
        "knight_veteran",
        "knight_weapon_drill",
        "crusader_holy_cross",
        "crusader_auto_guard",
        "crusader_devotion",
        "crusader_grand_cross",
        "crusader_defender",
        "crusader_faith",
        "crusader_reflect"
      ]
    },
    "merchant": {
      "cost_version": "merchant-class2-v1",
      "skill_ids": [
        "blacksmith_hammer_fall",
        "blacksmith_adrenaline",
        "blacksmith_weapon_perfection",
        "blacksmith_meltdown",
        "blacksmith_cart_crash",
        "blacksmith_weapon_research",
        "blacksmith_tempering",
        "alchemist_acid_terror",
        "alchemist_potion_pitcher",
        "alchemist_hell_plant",
        "alchemist_bio_cannibalize",
        "alchemist_demonstration",
        "alchemist_learning_potion",
        "alchemist_chemical_expertise"
      ]
    },
    "archer": {
      "cost_version": "archer-class2-v1",
      "skill_ids": [
        "hunter_blitz_beat",
        "hunter_hunters_mark",
        "hunter_ankle_snare",
        "hunter_claymore",
        "hunter_rapid_fire",
        "hunter_falcon",
        "hunter_steel_crow",
        "bard_performance_strike",
        "bard_healing_song",
        "bard_battle_song",
        "bard_dissonance",
        "bard_encore",
        "bard_music_lesson",
        "bard_breathing",
        "dancer_performance_strike",
        "dancer_healing_song",
        "dancer_battle_song",
        "dancer_dissonance",
        "dancer_encore",
        "dancer_music_lesson",
        "dancer_breathing"
      ]
    },
    "acolyte": {
      "cost_version": "acolyte-class2-v1",
      "skill_ids": [
        "priest_sanctuary",
        "priest_impositio",
        "priest_magnificat",
        "priest_resurrection",
        "priest_kyrie",
        "priest_healing_art",
        "priest_spirit_recovery",
        "monk_call_spirits",
        "monk_triple_attack",
        "monk_finger_offensive",
        "monk_asura",
        "monk_steel_body",
        "monk_iron_fist",
        "monk_spirit_combo"
      ]
    },
    "mage": {
      "cost_version": "mage-class2-v1",
      "skill_ids": [
        "wizard_storm_gust",
        "wizard_jupitel",
        "wizard_meteor",
        "wizard_quagmire",
        "wizard_heavens_drive",
        "wizard_amplified_magic",
        "wizard_frost_control",
        "sage_fire_endow",
        "sage_spell_breaker",
        "sage_dispel",
        "sage_psychic_bolt",
        "sage_magic_barrier",
        "sage_auto_bolt",
        "sage_wisdom"
      ]
    }
  },
  "base": {
    "learn_level_one_cost": {},
    "upgrade_cost_rows": [
      {
        "from_level": 1,
        "to_level": 2,
        "gold": 100,
        "skill_manual": 20
      },
      {
        "from_level": 2,
        "to_level": 3,
        "gold": 200,
        "skill_manual": 40
      },
      {
        "from_level": 3,
        "to_level": 4,
        "gold": 300,
        "skill_manual": 60
      },
      {
        "from_level": 4,
        "to_level": 5,
        "gold": 400,
        "skill_manual": 80
      },
      {
        "from_level": 5,
        "to_level": 6,
        "gold": 500,
        "skill_manual": 100
      },
      {
        "from_level": 6,
        "to_level": 7,
        "gold": 600,
        "skill_manual": 120
      },
      {
        "from_level": 7,
        "to_level": 8,
        "gold": 700,
        "skill_manual": 140
      },
      {
        "from_level": 8,
        "to_level": 9,
        "gold": 800,
        "skill_manual": 160
      },
      {
        "from_level": 9,
        "to_level": 10,
        "gold": 900,
        "skill_manual": 180
      }
    ]
  },
  "awakened": {
    "cost_version": "awakening-costs-v1",
    "upgrade_cost_rows": [
      {
        "from_level": 1,
        "to_level": 2,
        "gold": 4000,
        "awakening_shard": 10
      },
      {
        "from_level": 2,
        "to_level": 3,
        "gold": 6000,
        "awakening_shard": 15
      },
      {
        "from_level": 3,
        "to_level": 4,
        "gold": 8000,
        "awakening_shard": 20
      },
      {
        "from_level": 4,
        "to_level": 5,
        "gold": 10000,
        "awakening_shard": 25
      },
      {
        "from_level": 5,
        "to_level": 6,
        "gold": 12000,
        "awakening_shard": 30
      },
      {
        "from_level": 6,
        "to_level": 7,
        "gold": 14000,
        "awakening_shard": 35
      },
      {
        "from_level": 7,
        "to_level": 8,
        "gold": 16000,
        "awakening_shard": 40
      },
      {
        "from_level": 8,
        "to_level": 9,
        "gold": 18000,
        "awakening_shard": 45
      },
      {
        "from_level": 9,
        "to_level": 10,
        "gold": 20000,
        "awakening_shard": 50
      }
    ]
  },
  "awaken_unlock": {
    "gold": 25000,
    "awakening_shard": 20
  }
};
