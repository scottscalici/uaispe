import type { Exercise, Workout } from './types';

// Ported from the legacy static PE site (github.com/scottscalici/PE/workout) - real exercises
// and workouts already authored there, deduplicated and normalized to the current schema
// (rounds live per-circuit now, matching what the workout builder actually assembles).
export const seedExercises: Exercise[] = [
  {
    "id": "1-2-3_clap",
    "name": "1-2-3 Clap",
    "category": [
      "cardio",
      "warmup"
    ],
    "instructions": "1-2-3 knee, but lift knee high enough to be able to clap underneath",
    "safetyCues": "Modification: Stay grounded"
  },
  {
    "id": "1_2_3_knee",
    "name": "1-2-3 Knee",
    "category": [
      "lateral",
      "warmup",
      "agility"
    ],
    "safetyCues": "Modify: Step it out"
  },
  {
    "id": "squat",
    "name": "Air Squat",
    "category": [
      "lower",
      "cardio",
      "quads",
      "low impact"
    ],
    "instructions": "chest up",
    "safetyCues": "Modification: reduce ROM"
  },
  {
    "id": "arm_circles_01",
    "name": "Arm Circles",
    "category": [
      "upper body",
      "mobility"
    ],
    "instructions": "Small, controlled circles forward, then backward.",
    "safetyCues": "Keep your shoulders pulled down and back."
  },
  {
    "id": "attack",
    "name": "Attack",
    "category": [
      "cardio",
      "combat"
    ]
  },
  {
    "id": "boxer_jog",
    "name": "Boxer Jog",
    "category": [
      "warmup"
    ]
  },
  {
    "id": "jump_forward_back",
    "name": "Broad Jump Forward, Jog Back",
    "category": [
      "cardio",
      "lower",
      "plyometric"
    ]
  },
  {
    "id": "burpee_pushup",
    "name": "Burpee + Pushup",
    "category": [
      "upper",
      "cardio"
    ]
  },
  {
    "id": "burpee_jabs",
    "name": "Burpee Jabs",
    "category": [
      "cardio",
      "combat"
    ],
    "instructions": "Burpee, Jump, Land, 4 Jabs..."
  },
  {
    "id": "burpees_01",
    "name": "Burpees",
    "category": [
      "cardio",
      "full body"
    ],
    "instructions": "Drop to a plank, push-up, jump up.",
    "safetyCues": "Maintain core control during the jump back."
  },
  {
    "id": "butt_kicks",
    "name": "Butt Kicks",
    "category": [],
    "safetyCues": "Modify: Keep one foot grounded, slight forward lean"
  },
  {
    "id": "cooldown_chest_openers",
    "name": "Chest Openers",
    "category": [
      "cooldown"
    ],
    "instructions": "grab hands behind your back, push them down and away from body"
  },
  {
    "id": "child_pose",
    "name": "Child's Pose",
    "category": [
      "cooldown",
      "yoga"
    ]
  },
  {
    "id": "cooldown",
    "name": "Cool Down",
    "category": [
      "cooldown"
    ]
  },
  {
    "id": "jack_criss_cross",
    "name": "Criss Cross Jacks",
    "category": [
      "agility",
      "cardio",
      "warmup"
    ]
  },
  {
    "id": "jack_cross_squat",
    "name": "Criss Cross Squat Jack",
    "category": [
      "agility",
      "lower",
      "cardio"
    ],
    "instructions": "home to cross to home to cross to squat to cross..."
  },
  {
    "id": "cooldown_cross_body_stretch",
    "name": "Cross Body Stretch",
    "category": [
      "cooldown"
    ],
    "instructions": "L arm across chest, R arm pulls L arm from behind L elbow..."
  },
  {
    "id": "crunches_01",
    "name": "Crunches",
    "category": [
      "core"
    ],
    "instructions": "Short, controlled movements.",
    "safetyCues": "Don't pull on your neck."
  },
  {
    "id": "butt_kick_double",
    "name": "Double Butt Kicks",
    "category": [
      "warmup",
      "cardio"
    ],
    "instructions": "Hop twice on same leg, keep opposite leg bent, foot towards butt",
    "safetyCues": "Modification: Always keep one foot on ground"
  },
  {
    "id": "high_knee_lateral_double",
    "name": "Double Lateral High Knee",
    "category": [
      "lower",
      "agility",
      "warmup"
    ],
    "instructions": "Hop to side, lift knee, hop to side again, stay on one leg",
    "safetyCues": "Modification: Raise knee, step out, raise knee..."
  },
  {
    "id": "run_easy",
    "name": "Easy Run",
    "category": [],
    "instructions": "half butt kick"
  },
  {
    "id": "burpee_firecracker",
    "name": "Firecracker Burpees",
    "category": [
      "cardio"
    ]
  },
  {
    "id": "cooldown_flat_back",
    "name": "Flat Back",
    "category": [
      "cooldown"
    ]
  },
  {
    "id": "flutter_kicks_01",
    "name": "Flutter Kicks",
    "category": [
      "core",
      "lower body"
    ],
    "instructions": "Keep legs straight and alternate small kicks.",
    "safetyCues": "Press your lower back firmly into the floor."
  },
  {
    "id": "plank_01",
    "name": "Forearm Plank",
    "category": [
      "core",
      "isometric"
    ],
    "instructions": "Hold a straight line from head to heels.",
    "safetyCues": "Keep your hips level, no sagging."
  },
  {
    "id": "frog_jumps",
    "name": "Frog Jumps",
    "category": [
      "cardio",
      "lower"
    ]
  },
  {
    "id": "frog",
    "name": "Frog Position",
    "category": [
      "warmup",
      "position",
      "isometric"
    ],
    "instructions": "catcher with hands on the ground",
    "safetyCues": "don't touch ground, reduce ROM"
  },
  {
    "id": "jumps_globe",
    "name": "Globe Jumps",
    "category": [
      "cardio",
      "lower",
      "plyometric"
    ]
  },
  {
    "id": "grapevine",
    "name": "Grapevine",
    "category": [
      "cardio",
      "agility",
      "warmup"
    ],
    "instructions": "step, cross behind, step, touch"
  },
  {
    "id": "tuck_half",
    "name": "Half Tuck Jumps",
    "category": [
      "plyometric",
      "cardio",
      "lower"
    ]
  },
  {
    "id": "cooldown_hamstring",
    "name": "Hamstring Stretch",
    "category": [
      "cooldown"
    ]
  },
  {
    "id": "high_knees_01",
    "name": "High Knees",
    "category": [
      "cardio",
      "warmup"
    ],
    "instructions": "Drive your knees up to waist height.",
    "safetyCues": "Modify: Drive one knee up at a time, keep other foot grounded"
  },
  {
    "id": "plank_high",
    "name": "High Plank",
    "category": [
      "core",
      "warmup"
    ],
    "instructions": "pushup position"
  },
  {
    "id": "inchworms",
    "name": "Inchworms",
    "category": [
      "warmup"
    ],
    "instructions": "Standing, drop hands, and walk until in plank, walk feet to hands"
  },
  {
    "id": "jog",
    "name": "Jog",
    "category": [
      "warrmup",
      "cardio"
    ],
    "safetyCues": "Modify: just step, always keep one foot on the ground"
  },
  {
    "id": "jacks_jr",
    "name": "Jump Rope Jacks",
    "category": [
      "agility",
      "cardio"
    ]
  },
  {
    "id": "jack_press",
    "name": "Jumping Jack Shoulder Press",
    "category": [
      "cardio",
      "warmup"
    ]
  },
  {
    "id": "jumping_jacks_01",
    "name": "Jumping Jacks",
    "category": [
      "cardio",
      "warmup"
    ],
    "instructions": "Standard jumping jacks, maintain a steady rhythm.",
    "gifUrl": "assets/gifs/jacks.gif",
    "safetyCues": "Modify: Step out, keep one foot in the center, no jump"
  },
  {
    "id": "jacks_around",
    "name": "Jumping Jacks Around the World",
    "category": [
      "cardio",
      "warmup"
    ]
  },
  {
    "id": "lateral_bounds",
    "name": "Lateral Bounds",
    "category": [
      "explosive",
      "lateral",
      "unilateral"
    ],
    "instructions": "Jump one leg to to the other, cover distance, stick the landing"
  },
  {
    "id": "high_knees_lateral",
    "name": "Lateral High Knees",
    "category": [],
    "safetyCues": "Modify: don't leave the ground, side step, drive knee up"
  },
  {
    "id": "log_lumps",
    "name": "Log Jumps",
    "category": [
      "unilateral",
      "warmup"
    ]
  },
  {
    "id": "mountain_climbers_01",
    "name": "Mountain Climbers",
    "category": [
      "cardio",
      "core"
    ],
    "instructions": "In a plank position, drive knees to chest alternately.",
    "safetyCues": "Keep your shoulders directly over your wrists."
  },
  {
    "id": "mummy_kicks",
    "name": "Mummy Kicks",
    "category": [
      "warmup",
      "agility"
    ]
  },
  {
    "id": "high_knee_oblique",
    "name": "Oblique High Knee",
    "category": [
      "core",
      "cardio"
    ],
    "instructions": "Connect cross elbow with knee",
    "safetyCues": "Modification: Lift Knees, don't run"
  },
  {
    "id": "pushup_pike",
    "name": "Pike Pushups",
    "category": [
      "upper",
      "shoulders"
    ]
  },
  {
    "id": "power_jumps",
    "name": "Power Jumps",
    "category": [
      "explosive",
      "cardio",
      "plyometric"
    ]
  },
  {
    "id": "push_ups_01",
    "name": "Push-Ups",
    "category": [
      "upper body",
      "strength",
      "bilateral"
    ],
    "instructions": "Keep your core tight and butt even with your back",
    "gifUrl": "assets/gifs/pushups.gif",
    "safetyCues": "Don't let your lower back sag."
  },
  {
    "id": "pushup_jack",
    "name": "Pushup Jacks",
    "category": [
      "upper",
      "cardio",
      "arms",
      "core"
    ]
  },
  {
    "id": "cooldown_quad_stretch",
    "name": "Quad Stretch",
    "category": [
      "cooldown"
    ]
  },
  {
    "id": "rest_01",
    "name": "Recovery",
    "category": [
      "rest"
    ],
    "instructions": "Deep breaths and hydrate."
  },
  {
    "id": "lunge_reverse",
    "name": "Reverse Lunge",
    "category": [
      "cardio",
      "lower",
      "stability"
    ]
  },
  {
    "id": "lunge_reverse_twist",
    "name": "Reverse Lunge with a Twist",
    "category": [
      "cardio",
      "lower",
      "warmup"
    ]
  },
  {
    "id": "lunges_rocking_side",
    "name": "Rocking Side Lunges",
    "category": [
      "warmup",
      "lower",
      "cardio"
    ]
  },
  {
    "id": "plank_taps",
    "name": "Shoulder Taps",
    "category": [
      "core",
      "warmup"
    ]
  },
  {
    "id": "combo_shuffle_touch",
    "name": "Shuffle Touch Downs",
    "category": [
      "agility",
      "cardio"
    ],
    "instructions": "shuffle x 2-4, touch the floor, shuffle back"
  },
  {
    "id": "combo_side_lunge_vertical",
    "name": "Side Lunge to Vertical Jump",
    "category": [
      "cardio",
      "combo"
    ]
  },
  {
    "id": "combo_lunge_vertical_broad_jump",
    "name": "Side Lunge to Vertical Jump to Broad Jump, Jog Back",
    "category": [
      "combo",
      "cardio",
      "plyometric"
    ]
  },
  {
    "id": "step_touch_agility",
    "name": "Side to Side Step Touch Agility",
    "category": [
      "agility",
      "cardio"
    ]
  },
  {
    "id": "plank_1_arm",
    "name": "Single Arm Plank",
    "category": [
      "core",
      "upper"
    ]
  },
  {
    "id": "skater",
    "name": "Skaters",
    "category": [
      "cardio",
      "lower"
    ]
  },
  {
    "id": "soccer_juggle",
    "name": "Soccer Juggles",
    "category": [
      "cardio",
      "agility"
    ],
    "instructions": "High Knee, Tap Cross Knee x 2, Tap Cross Ankle x 2",
    "safetyCues": "Modification: lift knee, tap, lift foot, tap, or tap calf"
  },
  {
    "id": "skater_speed",
    "name": "Speed Skaters",
    "category": [
      "cardio",
      "lower"
    ],
    "instructions": "like skaters, but touch ground, stay low"
  },
  {
    "id": "squat_speed",
    "name": "Speed Squats",
    "category": [
      "cardio",
      "lower"
    ],
    "instructions": "Squats but quicker pace"
  },
  {
    "id": "squat_jack",
    "name": "Squat Jacks",
    "category": [
      "lower",
      "cardio",
      "quads"
    ],
    "instructions": "Low at center, High when Out",
    "safetyCues": "Modification: Step out instead of jump out"
  },
  {
    "id": "squat_jumps",
    "name": "Squat Jumps",
    "category": [
      "lower",
      "cardio",
      "plyo",
      "quads"
    ],
    "instructions": "Land softly",
    "safetyCues": "Modification: Lose the jump, reduce ROM"
  },
  {
    "id": "squat_knee_lift",
    "name": "Squat to Knee Lift",
    "category": [
      "cardio",
      "lower",
      "stability"
    ]
  },
  {
    "id": "squat_sumo_reach",
    "name": "Sumo Squat and Reach",
    "category": [
      "cardio",
      "warmup",
      "lower"
    ]
  },
  {
    "id": "jacks_sumo_squat",
    "name": "Sumo Squat Jacks",
    "category": [
      "cardio",
      "lower"
    ]
  },
  {
    "id": "t-180",
    "name": "T-180 Jacks",
    "category": [
      "agility",
      "warmup",
      "cardio"
    ]
  },
  {
    "id": "touch_the_floor",
    "name": "Touch the Floor",
    "category": [
      "cardio",
      "warmup"
    ],
    "safetyCues": "Modify: step out, touch floor, center, step to the other side, touch..."
  },
  {
    "id": "toy_soldier",
    "name": "Toy Soldier",
    "category": [
      "warmup"
    ]
  },
  {
    "id": "chair_dips_01",
    "name": "Tricep Dips",
    "category": [
      "upper body"
    ],
    "instructions": "Use a bench or chair, lower body until elbows are at 90 degrees.",
    "safetyCues": "Keep your back close to the bench."
  },
  {
    "id": "tuck",
    "name": "Tuck Jumps",
    "category": [
      "plyometric",
      "cardio",
      "lower"
    ]
  },
  {
    "id": "walkouts",
    "name": "Walkouts",
    "category": [
      "warmup"
    ],
    "instructions": "Standing, drop hands, and walk until in plank, walk hands back in"
  },
  {
    "id": "pushup_wide",
    "name": "Wide Pushups",
    "category": [
      "upper",
      "chest",
      "arms"
    ]
  }
];

export const seedWorkouts: Workout[] = [
  {
    "id": "alpha_01",
    "workoutName": "Industrial Strength Alpha",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 3,
        "sequence": [
          {
            "exerciseId": "jumping_jacks_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 15,
            "type": "rest"
          }
        ]
      }
    ]
  },
  {
    "id": "beta_02",
    "workoutName": "Cardio Core Beta",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 2,
        "sequence": [
          {
            "exerciseId": "jumping_jacks_01",
            "duration": 10,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 5,
            "type": "rest"
          }
        ]
      }
    ]
  },
  {
    "id": "finisher_core",
    "workoutName": "3-Min Core Burnout",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 1,
        "sequence": [
          {
            "exerciseId": "crunches_01",
            "duration": 45,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 15,
            "type": "rest"
          },
          {
            "exerciseId": "plank_01",
            "duration": 45,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 15,
            "type": "rest"
          },
          {
            "exerciseId": "flutter_kicks_01",
            "duration": 45,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 15,
            "type": "rest"
          }
        ]
      }
    ]
  },
  {
    "id": "finisher_cardio",
    "workoutName": "3-Min Cardio Push",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 1,
        "sequence": [
          {
            "exerciseId": "high_knees_01",
            "duration": 45,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 15,
            "type": "rest"
          },
          {
            "exerciseId": "burpees_01",
            "duration": 45,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 15,
            "type": "rest"
          },
          {
            "exerciseId": "mountain_climbers_01",
            "duration": 45,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 15,
            "type": "rest"
          }
        ]
      }
    ]
  },
  {
    "id": "finisher_upper",
    "workoutName": "3-Min Upper Body Blast",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 1,
        "sequence": [
          {
            "exerciseId": "push_ups_01",
            "duration": 45,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 15,
            "type": "rest"
          },
          {
            "exerciseId": "chair_dips_01",
            "duration": 45,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 15,
            "type": "rest"
          },
          {
            "exerciseId": "arm_circles_01",
            "duration": 45,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 15,
            "type": "rest"
          }
        ]
      }
    ]
  },
  {
    "id": "basics_01",
    "workoutName": "Basics 1",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 3,
        "sequence": [
          {
            "exerciseId": "jog",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "jumping_jacks_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "butt_kicks",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_lateral",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "rest"
          }
        ]
      }
    ]
  },
  {
    "id": "basics_02",
    "workoutName": "Basics 2",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 2,
        "sequence": [
          {
            "exerciseId": "jog",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "jumping_jacks_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_lateral",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "1_2_3_knee",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "butt_kicks",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "touch_the_floor",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "work"
          }
        ]
      }
    ]
  },
  {
    "id": "back_to_basics",
    "workoutName": "Back to Basics +",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 1,
        "sequence": [
          {
            "exerciseId": "jog",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "jumping_jacks_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_lateral",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "butt_kicks",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 60,
            "type": "rest"
          },
          {
            "exerciseId": "squat",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "1_2_3_knee",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "squat_jack",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "1-2-3_clap",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "squat_jumps",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "soccer_juggle",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "cooldown",
            "duration": 60,
            "type": "rest"
          }
        ]
      }
    ]
  },
  {
    "id": "basics_03",
    "workoutName": "Basics 3",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 1,
        "sequence": [
          {
            "exerciseId": "jog",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "jumping_jacks_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "butt_kicks",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "jog",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "jumping_jacks_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "butt_kicks",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "squat",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "touch_the_floor",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "squat_jack",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "squat",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "touch_the_floor",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "squat_jack",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "cooldown",
            "duration": 120,
            "type": "rest"
          }
        ]
      }
    ]
  },
  {
    "id": "basics_04",
    "workoutName": "Basics 4",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 1,
        "sequence": [
          {
            "exerciseId": "jog",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "jumping_jacks_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "butt_kicks",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_lateral",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "1_2_3_knee",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "jog",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "squat_jack",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knee_oblique",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "butt_kick_double",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knee_lateral_double",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "1_2_3_knee",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 45,
            "type": "rest"
          },
          {
            "exerciseId": "cooldown",
            "duration": 60,
            "type": "rest"
          }
        ]
      }
    ]
  },
  {
    "id": "burpees_101",
    "workoutName": "Burpees 101",
    "circuits": [
      {
        "circuitId": "A",
        "rounds": 1,
        "sequence": [
          {
            "exerciseId": "jog",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "jumping_jacks_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "butt_kicks",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "squat",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "jog",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "squat_jack",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "high_knees_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "butt_kicks",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "burpees_01",
            "duration": 60,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "cooldown",
            "duration": 60,
            "type": "rest"
          }
        ]
      }
    ]
  },
  {
    "id": "core_basics",
    "workoutName": "Core Basics",
    "circuits": [
      {
        "circuitId": "Warmup",
        "rounds": 1,
        "sequence": [
          {
            "exerciseId": "jog",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "jack_press",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "walkouts",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "squat",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "rest_01",
            "duration": 30,
            "type": "rest"
          }
        ]
      },
      {
        "circuitId": "Circuit A",
        "rounds": 2,
        "sequence": [
          {
            "exerciseId": "plank_high",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "child_pose",
            "duration": 20,
            "type": "rest"
          },
          {
            "exerciseId": "plank_taps",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "child_pose",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "push_ups_01",
            "duration": 30,
            "type": "work"
          },
          {
            "exerciseId": "child_pose",
            "duration": 60,
            "type": "rest"
          }
        ]
      },
      {
        "circuitId": "Cooldown",
        "rounds": 1,
        "sequence": [
          {
            "exerciseId": "cooldown_chest_openers",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "cooldown_cross_body_stretch",
            "duration": 30,
            "type": "rest"
          },
          {
            "exerciseId": "cooldown",
            "duration": 30,
            "type": "rest"
          }
        ]
      }
    ]
  }
];
