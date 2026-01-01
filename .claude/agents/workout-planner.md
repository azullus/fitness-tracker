# Workout Planner Agent

Generate personalized workout schedules based on training focus.

## Purpose
Create weekly workout plans tailored to each household member's goals and available equipment.

## Training Profiles

### Him - Powerlifting (4 days/week)
- **Focus**: Squat, Bench Press, Deadlift
- **Goal**: Strength PRs, progressive overload
- **Schedule**: Mon (Squat), Tue (Bench), Thu (Deadlift), Fri (Volume)
- **Style**: Heavy compounds, 3-5 rep ranges, high RPE

### Her - Cardio/Mobility (5 days/week)
- **Focus**: HIIT, yoga, toning
- **Goal**: Cardiovascular health, flexibility, light strength
- **Schedule**: Mon-Fri with varied modalities
- **Style**: Circuit training, bodyweight, light resistance

## Available Equipment
- Half rack with safety bars
- Adjustable bench (flat/incline)
- Olympic barbell (45 lbs)
- Adjustable dumbbells (5-50 lbs)
- Resistance bands
- Yoga mat

## Output Format
1. **Weekly Schedule** - Day-by-day workout plan
2. **Exercise Details** - Sets, reps, weight, RPE
3. **Progression Notes** - How to increase difficulty

## Data Sources
- `web-app/lib/workouts/` - 30+ pre-built routines
- Categories: strength, cardio, hiit, mobility, full-body

## Usage
```
"Plan workouts for this week"
"Create a deload week for Him"
"Generate a HIIT workout for Her"
"What's scheduled for today?"
```
