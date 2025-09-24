# Project Brief: Web-SQLite Pure HTML Example Refactoring

## Project Overview
Refactor the pure-html example from object-oriented programming (OOP) to functional programming while maintaining OPFS-only support and removing redundant code.

## Core Requirements
1. **Functional Programming**: Convert from classes to pure functions with immutability
2. **OPFS Focus**: Remove non-OPFS storage methods and related code
3. **Code Cleanup**: Remove redundant and unnecessary code
4. **Maintain Functionality**: Preserve all current features while improving code structure

## Current Architecture (OOP)
- `SQLiteWASMDemo` class - Main application controller
- `DatabaseManager` class - Database operations and worker management  
- `UIController` class - UI interactions and event handling

## Target Architecture (Functional)
- Pure functions for application initialization and lifecycle
- Functional modules for database operations
- Event-driven UI management with pure functions
- Immutable state management

## Key Constraints
- Must support only OPFS (Origin Private File System)
- Remove memory database and other VFS options
- Maintain Web Worker architecture for non-blocking operations
- Preserve all current UI features and functionality

## Success Criteria
- Code is purely functional with no classes
- OPFS is the only supported storage method
- All redundant code is removed
- Application maintains identical user experience
- Code is more readable and maintainable
