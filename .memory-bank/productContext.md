# Product Context: SQLite WASM Pure HTML Demo

## Purpose
This is a comprehensive demonstration of SQLite WebAssembly capabilities, showcasing how to run a full SQL database in the browser with persistent storage.

## Problems It Solves
1. **Client-Side Database**: Enables complex data operations without server round-trips
2. **Offline Data Storage**: Provides persistent, relational data storage in web applications
3. **Performance**: Leverages WebAssembly for near-native database performance
4. **Developer Experience**: Offers a simple, familiar SQL interface for web developers

## How It Should Work
1. **Initialization**: Load SQLite WASM module in a Web Worker for non-blocking operations
2. **OPFS Storage**: Use Origin Private File System for persistent, file-based database storage
3. **SQL Interface**: Provide a full SQL editor with syntax highlighting and execution
4. **Real-time Feedback**: Show query results, schema information, and performance metrics
5. **Developer Tools**: Include sample data creation, performance testing, and database export

## User Experience Goals
- **Immediate Feedback**: Users see results instantly after SQL execution
- **Professional Interface**: Clean, organized layout with clear sections for different functions
- **Educational**: Help users understand SQLite capabilities through examples and tests
- **Reliable**: Handle errors gracefully with clear error messages and recovery options
- **Performant**: Maintain responsive UI even during heavy database operations

## Key Features
- SQL command execution with multiple result formats
- Database schema exploration and visualization
- Performance monitoring and benchmarking
- Transaction testing and demonstration
- Sample data generation for experimentation
- Database export functionality for data portability
