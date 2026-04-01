-- Add level column to exercises for grouping by program level
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS level text DEFAULT 'beginner';

-- Update exercises used exclusively in Super Beginner workouts
UPDATE public.exercises SET level = 'super_beginner' WHERE name IN (
  'Bodyweight Squat', 'Glute Bridge', 'Incline Push-Ups', 'Band Rows', 'Band Chest Press',
  'Band Shoulder Press', 'Dead Bug', 'Sit-to-Stand Squats', 'Band Pull-Apart',
  'Step-Back Lunges', 'Band Glute Kickbacks', 'Standing Band Crunch', 'Bird Dog',
  'Standing Band Abduction', 'Lateral Band Walk', 'Air Squat', 'Air Calf Raises',
  'Air Jumping Lunges', 'Air Bulgarian Split Squat', 'Air Goblet Squat'
);

-- Update exercises used in Advanced workouts
UPDATE public.exercises SET level = 'advanced' WHERE name IN (
  'Machine Shoulder Press', 'Lateral Raise', 'Cable Front Raise', 'Face Pull',
  'Lying Leg Curls', 'Stiff Leg Deadlifts', 'Unilateral Hip Thrust',
  'Butt Blaster', 'Butt Blaster Machine', 'Incline Dumbbell Press', 'Dumbbell Flys',
  'Unilateral Dumbbell Curls', 'Hammer Curl', 'Bench Triceps Dip',
  'Hack Squat', 'Hack Squat Machine', 'Bulgarian Split Squat', 'Dumbbell Step-Ups',
  'Wide Grip Lat Pull', 'Cable Pullover', 'Close Grip Pull', 'One Arm Dumbbell Row',
  'Seated Cable Row', 'Bodyweight Reverse Hyper', 'Cable Standing Hip Abduction',
  'Seated Hip Abduction Machine', 'Cable Kickbacks', 'Good Mornings',
  'Barbell Squat', 'Deadlifts', 'Skull Crushers', 'Spider Curls',
  'Concentration Curls', 'Hex Press', 'Landmine Press', 'Decline Sit Ups',
  'Cable Crunches', 'Hanging Leg Raises', 'Pull Ups', 'Chin Ups', 'Dips',
  'Barbell Bench Press', 'Barbell Rows', 'Barbell Lunge', 'Barbell Standing Curls'
);

-- Update exercises used in Beginner workouts (keep as 'beginner')
UPDATE public.exercises SET level = 'beginner' WHERE name IN (
  'Hip Thrust', 'Walking Lunges', 'Leg Press', 'Leg Press Machine',
  'Reverse Hack Squats', 'Abductors', 'Low Cable Rope Curls',
  'Hammer Strength High Row', 'Lat Pull Down', 'High Cable Rope Pull',
  'Triceps Rope Push Downs', 'Overhead Rope Extensions', 'Upright Row',
  'Reverse Fly', 'Dumbbell Shoulder Press', 'Incline Press',
  'Dumbbell Rows', 'Row Machine', 'Overhead Press', 'Machine Overhead Press',
  'Rear Delt Fly Machine', 'Rear Delt Flies with Dumbbells', 'Front Raises with Dumbbells',
  'Lateral Dumbbell Raises', 'Chest Press Machine', 'Pec Fly Machine',
  'Leg Extension', 'Leg Curl Machine', 'Calf Raise Machine',
  'Push-Ups', 'Alt Pulldown Machine', 'Cable Row', 'Cable Flies',
  'Cable Tricep Push Down', 'Glute Kickback', 'Glute Machine', 'Glute Press Machine',
  'Glute Bridge', 'Plank', 'Side Plank', 'Crunches', 'Bicycle Crunch',
  'Leg Raises', 'Russian Twists', '6-Inch Hold', 'In and Outs off Bench',
  'Sit Ups', 'V-Ups', 'Dumbbell Standing Alternating Curls', 'Dumbbell Seated Curls',
  'Tricep Dumbbell Kickbacks'
);