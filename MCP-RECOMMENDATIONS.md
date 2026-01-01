# MCP Recommendations for FITNESS-TRACKER

Recommended Model Context Protocol servers to enhance the fitness tracking application.

---

## Priority 1: Essential MCPs

### Supabase MCP
- **Source**: `@supabase/mcp` or `supabase-community/supabase-mcp`
- **Purpose**: Direct database operations from Claude
- **Why**: Already using Supabase - enables AI-assisted data management
- **Install**:
```bash
npx @supabase/mcp
```

### OpenNutrition MCP
- **Source**: `deadletterq/mcp-opennutrition`
- **Purpose**: Offline food database with 300,000+ foods
- **Why**:
  - Canadian nutrition data (CNF) - relevant for Edmonton
  - Barcode lookup support
  - Runs completely locally - no API costs
- **Features**: Food search, nutritional info, barcode scanning

### Filesystem MCP
- **Source**: `@modelcontextprotocol/server-filesystem`
- **Purpose**: Read/write CSV tracking files and markdown plans
- **Install**:
```bash
npx @modelcontextprotocol/server-filesystem /mnt/c/Obsidian/AI-Projects/FITNESS-TRACKER
```

---

## Priority 2: Fitness Enhancement

### wger-mcp (Exercise Database)
- **Source**: `Juxsta/wger-mcp`
- **Purpose**: Access 400+ exercises with form instructions
- **Features**:
  - Search by muscle group or equipment
  - Workout routine creation
  - Exercise details with proper form
- **Use Case**: Enhance powerlifting and cardio workout generation

### Memory MCP
- **Source**: `@modelcontextprotocol/server-memory`
- **Purpose**: Persistent knowledge graph for user preferences
- **Why**: Remember dietary restrictions (banana allergy), training preferences
- **Install**:
```bash
npx @modelcontextprotocol/server-memory
```

### Kitchen MCP
- **Source**: `paulabaal12/kitchen-mcp`
- **Purpose**: Ingredient substitutions and recipe suggestions
- **Why**: Handle banana allergy substitutions automatically
- **Features**: Diet-based recipes, mood-based food, utensil recommendations

---

## Priority 3: Integration MCPs

### Mealie MCP
- **Source**: `mdlopresti/mealie-mcp`
- **Purpose**: Connect to your existing Mealie instance
- **Why**: Already have Mealie in DOCKER-DB stack
- **Features**: Recipe management, meal planning, shopping lists

### Google Calendar MCP
- **Source**: `nspady/google-calendar-mcp`
- **Purpose**: Schedule workouts and meal prep
- **Features**:
  - Natural language date/time
  - Recurring events
  - Multiple account support

---

## Configuration

### Claude Desktop Config
**Location**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/mnt/c/Obsidian/AI-Projects/FITNESS-TRACKER"
      ]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {
        "MEMORY_FILE_PATH": "/mnt/c/Obsidian/AI-Projects/FITNESS-TRACKER/data/memory.json"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp"]
    },
    "nutrition": {
      "command": "npx",
      "args": ["-y", "mcp-opennutrition"]
    }
  }
}
```

### Windows Native (Not WSL)
```json
{
  "command": "cmd",
  "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-filesystem", "C:\\Obsidian\\AI-Projects\\FITNESS-TRACKER"]
}
```

---

## Use Cases

| Task | MCP | Example Command |
|------|-----|-----------------|
| Log food with macros | OpenNutrition | "Log 200g chicken breast" |
| Find exercises | wger | "Show quad exercises for home gym" |
| Substitute ingredient | Kitchen | "Replace banana in this recipe" |
| Schedule workout | Google Calendar | "Add squat day Monday 6pm" |
| Query database | Supabase | "Show weight entries for last week" |
| Remember preference | Memory | "Remember I prefer morning workouts" |

---

## Data Flow with MCPs

```
User Request
    ↓
Claude (with MCPs)
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│  OpenNutrition  │     wger-mcp    │   Supabase MCP  │
│   (Food data)   │  (Exercises)    │   (Database)    │
└────────┬────────┴────────┬────────┴────────┬────────┘
         │                 │                 │
         ↓                 ↓                 ↓
    Meal Logging     Workout Plans     Data Persistence
         │                 │                 │
         └─────────────────┼─────────────────┘
                           ↓
                    FITNESS-TRACKER
                      Web App
```

---

## Privacy Considerations

### Local-Only MCPs (No External Calls)
- OpenNutrition - All data local
- Filesystem - Local files only
- Memory - Local JSONL storage

### Cloud MCPs (Require Auth)
- Supabase - Your own database
- Google Calendar - Google account
- Strava/Garmin - Fitness accounts

### Self-Hosted Options
- MCPJungle - Self-hosted gateway
- SearXNG - Private web search
