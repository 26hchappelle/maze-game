# Unity WebGL Game Development Project

## Project Overview
This is a solo Unity game development project focused on rapid prototyping and learning Unity. The game will be deployed as a WebGL build for web browsers (Chrome/desktop).

## Technical Stack
- **Unity Version**: 6.1
- **Platform**: WebGL (Web browsers, Chrome/desktop)
- **MCP Integrations**: 
  - mcp-unity for AI-assisted Unity development
  - context7 for enhanced context management
  - github-server for GitHub operations
- **Version Control**: GitHub (repository already initialized)
- **Deployment**: Vercel / GitHub Pages
- **Development Focus**: Rapid prototyping, learning Unity fundamentals

## MCP Server Configuration

### Available MCP Servers

#### 1. Unity MCP Server (mcp-unity)
**Purpose**: Direct Unity Editor control and automation
- **Scene Manipulation**: Create, modify, and manage Unity scenes through natural language
- **Code Generation**: Generate C# scripts and Unity components
- **Asset Management**: Handle Unity assets and resources
- **Editor Automation**: Automate repetitive Unity Editor tasks
- **Testing Support**: Run and manage Unity tests

**Setup**: Ensure Unity Editor is running when using Unity MCP commands

#### 2. Context7 MCP Server
**Purpose**: Enhanced context and memory management across development sessions
- **Persistent Memory**: Maintains context about your project across sessions
- **Learning Tracking**: Remembers what Unity concepts you've learned
- **Project State**: Tracks current development progress and decisions
- **Pattern Recognition**: Identifies and suggests patterns from your codebase

**Common Commands**:
- Store project context: "Remember that we're building a [game type] with [features]"
- Recall decisions: "What approach did we decide for [feature]?"
- Track progress: "What Unity concepts have we covered?"

#### 3. GitHub MCP Server
**Purpose**: Seamless GitHub integration for version control and collaboration
- **Repository Management**: Create, clone, and manage repositories
- **Branch Operations**: Create, switch, and merge branches
- **Pull Requests**: Create and manage PRs directly
- **Issues Tracking**: Create and update GitHub issues
- **Actions Integration**: Trigger and monitor GitHub Actions

**Common Commands**:
- "Create a new branch for [feature]"
- "Open a pull request for the current changes"
- "Check the status of GitHub Actions"
- "Create an issue for [bug/feature]"

### MCP Server Installation & Configuration
1. Install all three MCP servers following their respective documentation
2. Configure Claude Desktop's MCP settings to include all three servers
3. Ensure Unity Editor is running when using Unity-specific MCP commands
4. Test each MCP connection before starting development

## Project Structure

```
/game/                      # Root project directory (Unity project)
├── Assets/
│   ├── Scripts/           # All C# game scripts
│   ├── Prefabs/           # Reusable game objects
│   ├── Materials/         # Materials and shaders
│   ├── Textures/          # Image assets
│   ├── Audio/             # Sound effects and music
│   ├── Scenes/            # Unity scenes
│   └── WebGLTemplates/    # Custom WebGL templates
├── Packages/              # Unity Package Manager
├── ProjectSettings/       # Unity project settings
├── Build/                 # WebGL build output (gitignored)
├── .gitignore            # Git ignore file
├── CLAUDE.md             # This file
└── vercel.json           # Vercel deployment config (when needed)
```

## Development Guidelines

### Code Standards
- Follow standard C# naming conventions
- Keep scripts modular with single responsibility
- Use Unity's component-based architecture effectively
- Comment complex logic for learning purposes

### Git Workflow (Enhanced with GitHub MCP)
- Commit frequently with descriptive messages
- Use `.gitignore` for Unity-specific files (Library/, Temp/, Logs/, Build/)
- Track meta files for Unity assets
- Use Git LFS for large binary files if needed
- Leverage GitHub MCP for:
  - Automated branch creation for features
  - Direct PR creation from Claude
  - Issue tracking linked to development tasks
  - GitHub Actions monitoring for CI/CD

### Testing Approach
- Test gameplay features in Unity Editor Play Mode
- Build WebGL locally to test browser compatibility
- Use Unity Test Framework when appropriate
- Focus on rapid iteration over comprehensive testing (learning project)

## WebGL Build & Deployment

### Local Testing
```bash
# Build WebGL from Unity Editor:
# File > Build Settings > WebGL > Build

# Test locally with Python server:
python3 -m http.server 8000 --directory Build/
# Then open http://localhost:8000
```

### Vercel Deployment
1. Create `vercel.json` in project root:
```json
{
  "headers": [
    {
      "source": "/(.*).unityweb",
      "headers": [
        {
          "key": "Content-Encoding",
          "value": "br"
        },
        {
          "key": "Content-Type",
          "value": "application/octet-stream"
        }
      ]
    },
    {
      "source": "/(.*).wasm",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/wasm"
        }
      ]
    }
  ]
}
```

2. Enable compression in Unity Build Settings:
   - Player Settings > Publishing Settings > Compression Format: Brotli

3. Deploy to Vercel:
```bash
vercel --prod
```

### GitHub Pages Alternative
For smaller builds (<100MB):
1. Build WebGL with Gzip compression
2. Push build files to `gh-pages` branch
3. Enable GitHub Pages in repository settings

## Common Commands

### Unity Editor (via Unity MCP)
- Create new scene: "Create a new Unity scene called [SceneName]"
- Add GameObject: "Add a [ObjectType] to the scene"
- Generate script: "Create a C# script for [functionality]"
- Modify properties: "Change the [property] of [GameObject] to [value]"

### Context Management (via Context7 MCP)
- Save context: "Remember that we're using [approach] for [feature]"
- Recall context: "What was our approach for [feature]?"
- Track learning: "Mark that I've learned about [Unity concept]"
- Project status: "What's the current state of the project?"

### GitHub Operations (via GitHub MCP)
- Create branch: "Create a new branch called feature/[name]"
- Check status: "Show current git status and recent commits"
- Create PR: "Create a pull request for the current branch"
- Manage issues: "Create an issue for [description]"
- Check CI/CD: "Check GitHub Actions status"

### Build Commands
```bash
# Clean build artifacts
rm -rf Build/ Library/

# Open Unity project (macOS)
open -a "Unity Hub"

# Run Unity in batch mode for CI/CD
/Applications/Unity/Hub/Editor/6.1.x/Unity.app/Contents/MacOS/Unity \
  -batchmode -quit -projectPath . \
  -buildTarget WebGL \
  -executeMethod BuildScript.BuildWebGL
```

## Performance Optimization

### WebGL Specific
- Keep texture sizes reasonable (max 2048x2048 for web)
- Use texture atlases to reduce draw calls
- Minimize use of real-time shadows
- Use object pooling for frequently spawned objects
- Enable compression for all build files
- Consider using Unity's Addressables for asset loading

### Build Size Optimization
- Strip unused code in Player Settings
- Use IL2CPP code stripping level: High
- Disable unnecessary Unity modules
- Compress textures appropriately
- Remove unused assets before building

## Troubleshooting

### Common Issues
1. **Build too large for deployment**: Use Brotli compression, strip unused assets
2. **WebGL memory errors**: Adjust memory size in Player Settings
3. **Shader compilation issues**: Use WebGL-compatible shaders only
4. **Input not working**: Check WebGL input settings in Player Settings

### MCP Connection Issues
- Ensure Unity Editor is running
- Check MCP server is started
- Verify Claude Desktop MCP configuration
- Restart both Unity and MCP server if needed

## Quick Reference

### File Extensions to Track
- `.cs` - C# scripts
- `.unity` - Scene files  
- `.prefab` - Prefab files
- `.mat` - Materials
- `.asset` - ScriptableObjects and other assets
- `.meta` - Unity metadata (always commit with assets)

### Files to Ignore
- `/Library/` - Unity's cache
- `/Temp/` - Temporary files
- `/Obj/` - Compilation files
- `/Build/` - Build outputs
- `/Builds/` - Alternative build directory
- `/Logs/` - Unity logs
- `*.csproj` - Visual Studio projects
- `*.sln` - Solution files

## Resources

- [Unity Documentation](https://docs.unity3d.com/)
- [Unity WebGL Documentation](https://docs.unity3d.com/Manual/webgl.html)
- [mcp-unity Repository](https://github.com/CoderGamester/mcp-unity)
- [Unity Learn](https://learn.unity.com/)
- [WebGL Build Optimization](https://docs.unity3d.com/Manual/webgl-building.html)

## Notes for AI Assistant

When assisting with this project:
1. Prioritize rapid prototyping over production-quality code
2. Provide learning-friendly explanations when introducing new Unity concepts
3. Use the appropriate MCP servers:
   - Unity MCP for Unity Editor operations
   - Context7 MCP to maintain project continuity
   - GitHub MCP for version control operations
4. Always test WebGL builds locally before deployment
5. Keep build sizes minimal for web deployment
6. Focus on browser compatibility (Chrome primary target)
7. Suggest simple solutions first, optimize later if needed
8. Remember this is a learning project - explain Unity patterns and best practices
9. Use Context7 to track what Unity concepts have been covered
10. Leverage GitHub MCP for efficient branch management and PR creation
11. Maintain context across sessions using Context7 for better continuity

## MCP Integration Workflow

### Typical Development Session
1. **Start**: Use Context7 to recall project state and recent decisions
2. **Development**: Use Unity MCP for Editor operations and code generation
3. **Version Control**: Use GitHub MCP for commits, branches, and PRs
4. **End**: Use Context7 to save important decisions and progress

### Cross-MCP Coordination
- When implementing a feature:
  1. Context7: Recall previous decisions about the feature
  2. Unity MCP: Implement the feature in Unity
  3. GitHub MCP: Create feature branch and commit changes
  4. Context7: Store new learnings and decisions

### Learning Progress Tracking
- Use Context7 to maintain a learning journal:
  - Unity concepts mastered
  - Patterns discovered
  - Solutions to common problems
  - Project-specific conventions developed