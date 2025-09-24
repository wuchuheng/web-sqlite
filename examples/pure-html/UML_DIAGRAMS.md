# SQLite WASM UML Diagrams

This file contains detailed UML diagrams for the SQLite WASM architecture and API design.

## Component Diagram

```mermaid
graph TB
    subgraph "Web Browser"
        subgraph "Main Thread"
            APP[SQLiteWASMDemo<br/>Application]
            UI[UIController<br/>User Interface]
            DM[DatabaseManager<br/>API Wrapper]
            ES[EventSystem<br/>Event Bus]
        end

        subgraph "Web Worker Thread"
            WW[SQLite Worker<br/>Background Thread]
            WASM[SQLite WASM<br/>Core Engine]
        end

        subgraph "Storage Layer"
            MEM[Memory Storage<br/>RAM Based]
            OPFS[OPFS Storage<br/>Persistent]
            IDB[IndexedDB<br/>Fallback]
        end
    end

    subgraph "External Dependencies"
        SF[SQLite Files<br/>WASM + JS]
        WA[Web APIs<br/>Browser Features]
    end

    APP --> UI
    APP --> DM
    UI --> DM
    DM --> ES
    DM <--> WW
    WW --> WASM
    WASM --> MEM
    WASM --> OPFS
    WASM --> IDB
    WW --> SF
    OPFS --> WA
    IDB --> WA

    style APP fill:#e1f5fe
    style WW fill:#f3e5f5
    style WASM fill:#e8f5e8
    style OPFS fill:#fff3e0
```

## Sequence Diagram - Database Initialization

```mermaid
sequenceDiagram
    participant App as SQLiteWASMDemo
    participant DM as DatabaseManager
    participant WW as SQLite Worker
    participant FS as File System

    App->>DM: initialize()
    DM->>WW: new Worker('sqlite3-worker1.js')
    WW->>WW: Load WASM module
    WW->>FS: Initialize storage
    FS-->>WW: Storage ready
    WW-->>DM: Worker ready

    DM->>WW: {type: 'open', filename: 'db.sqlite3'}
    WW->>FS: Create/Open database file
    FS-->>WW: Database handle
    WW-->>DM: {dbId: 'db#1', filename: 'db.sqlite3'}
    DM-->>App: Database initialized

    Note over App,FS: Database is ready for operations
```

## Sequence Diagram - SQL Execution

```mermaid
sequenceDiagram
    participant UI as UIController
    participant DM as DatabaseManager
    participant WW as SQLite Worker
    participant WASM as SQLite WASM
    participant ES as Event System

    UI->>DM: executeSQL(sql, options)
    DM->>DM: Generate unique messageId
    DM->>WW: postMessage({type: 'exec', sql, messageId})

    WW->>WASM: sqlite3_prepare_v2(sql)
    WASM-->>WW: Statement handle

    loop For each parameter
        WW->>WASM: sqlite3_bind_*()
    end

    WW->>WASM: sqlite3_step()
    WASM-->>WW: Row data

    loop While SQLITE_ROW
        WW->>WASM: sqlite3_step()
        WASM-->>WW: More row data
    end

    WW->>WASM: sqlite3_finalize()
    WW->>DM: postMessage({result, messageId})

    DM->>ES: emit('queryComplete', data)
    ES->>UI: Event notification
    UI->>UI: Update interface

    Note over UI,WASM: All operations are asynchronous
```

## State Diagram - DatabaseManager States

```mermaid
stateDiagram-v2
    [*] --> Uninitialized

    Uninitialized --> Initializing: initialize()
    Initializing --> Ready: Worker loaded
    Initializing --> Error: Init failed

    Ready --> Executing: executeSQL()
    Executing --> Ready: Query complete
    Executing --> Error: Query failed

    Ready --> Opening: openDatabase()
    Opening --> Ready: Database opened
    Opening --> Error: Open failed

    Error --> Ready: Reset/Retry
    Error --> [*]: Cleanup

    Ready --> Exporting: exportDatabase()
    Exporting --> Ready: Export complete

    Ready --> [*]: cleanup()
```

## Class Diagram - Detailed API Structure

```mermaid
classDiagram
    class SQLiteWASMDemo {
        -DatabaseManager databaseManager
        -UIController uiController
        -Object config
        -boolean initialized
        +initialize() Promise~void~
        +cleanup() void
        +getStats() Object
        +getDatabaseManager() DatabaseManager
        +getUIController() UIController
    }

    class DatabaseManager {
        -Worker worker
        -Map~string,Object~ pendingMessages
        -Object stats
        -Object eventListeners
        -string workerScript
        -number messageId
        -boolean initialized

        +initialize() Promise~void~
        +openDatabase(filename, options) Promise~Object~
        +executeSQL(sql, options) Promise~Object~
        +getSchema() Promise~Object~
        +createSampleData() Promise~void~
        +runPerformanceTest() Promise~Object~
        +testTransactions() Promise~Object~
        +exportDatabase() Promise~Object~
        +clearDatabase() Promise~void~
        +getStats() Object
        +cleanup() void

        +on(event, callback) void
        +off(event, callback) void
        +emit(event, data) void
        -handleWorkerMessage(event) void
        -handleWorkerError(error) void
        -generateMessageId() string
        -updateStats(data) void
    }

    class UIController {
        -DatabaseManager dbManager
        -Object elements
        -boolean autoScroll
        -number maxLogEntries

        +constructor(databaseManager)
        +showApp() void
        +executeSql() Promise~void~
        +displayQueryResult(data) void
        +updatePerformanceStats(stats) void
        +showError(message, details) void
        +addLogEntry(data) void
        +createSampleData() Promise~void~
        +runPerformanceTest() Promise~void~
        +testTransactions() Promise~void~
        +exportDatabase() Promise~void~
        +clearDatabase() Promise~void~

        -bindEvents() void
        -safeAddEventListener(element, event, handler) void
        -formatExecutionTime(time) string
        -createResultTable(rows, columns) string
        -sanitizeHtml(str) string
    }

    class WorkerProxy {
        <<interface>>
        +postMessage(data) void
        +terminate() void
        +onmessage EventHandler
        +onerror EventHandler
        +onmessageerror EventHandler
    }

    class QueryResult {
        +Array resultRows
        +Array columnNames
        +number changeCount
        +number lastInsertRowId
        +string sql
        +number executionTime
    }

    class DatabaseStats {
        +number totalQueries
        +number totalTime
        +number lastQueryTime
        +number rowsAffected
        +number avgTime
        +Date lastQuery
    }

    class SchemaInfo {
        +Array~TableInfo~ table
        +Array~IndexInfo~ index
        +Array~ViewInfo~ view
        +Array~TriggerInfo~ trigger
    }

    class TableInfo {
        +string name
        +string sql
        +Array~ColumnInfo~ columns
        +Array~IndexInfo~ indexes
    }

    class ColumnInfo {
        +string name
        +string type
        +boolean notnull
        +boolean primaryKey
        +any defaultValue
        +number cid
    }

    SQLiteWASMDemo --> DatabaseManager
    SQLiteWASMDemo --> UIController
    UIController --> DatabaseManager
    DatabaseManager --> WorkerProxy
    DatabaseManager --> QueryResult
    DatabaseManager --> DatabaseStats
    DatabaseManager --> SchemaInfo
    SchemaInfo --> TableInfo
    TableInfo --> ColumnInfo

    DatabaseManager : +Events~connect,disconnect,queryComplete,error,log~
```

## Activity Diagram - Query Execution Flow

```mermaid
flowchart TD
    Start([User executes SQL]) --> Validate{Valid SQL?}

    Validate -->|No| ShowError[Show syntax error]
    ShowError --> End([End])

    Validate -->|Yes| CheckWorker{Worker ready?}
    CheckWorker -->|No| InitWorker[Initialize worker]
    InitWorker --> CheckWorker

    CheckWorker -->|Yes| PrepareQuery[Prepare query message]
    PrepareQuery --> SendToWorker[Send to worker thread]

    SendToWorker --> WorkerProcess[Worker processes SQL]
    WorkerProcess --> CheckError{Execution error?}

    CheckError -->|Yes| HandleError[Handle database error]
    HandleError --> EmitError[Emit error event]
    EmitError --> End

    CheckError -->|No| ProcessResult[Process query results]
    ProcessResult --> UpdateStats[Update performance stats]
    UpdateStats --> EmitComplete[Emit queryComplete event]
    EmitComplete --> UpdateUI[Update user interface]
    UpdateUI --> End

    style Start fill:#e1f5fe
    style End fill:#e8f5e8
    style ShowError fill:#ffebee
    style HandleError fill:#ffebee
```

## Deployment Diagram

```mermaid
graph TB
    subgraph "Web Server"
        SF[Static Files<br/>HTML/CSS/JS]
        WF[WASM Files<br/>SQLite Binary]
        HD[HTTP Headers<br/>COOP/COEP]
    end

    subgraph "Browser Environment"
        subgraph "Main Thread"
            APP[Application]
            DOM[DOM]
            UI[UI Components]
        end

        subgraph "Worker Thread"
            WW[SQLite Worker]
            WASM[WASM Runtime]
        end

        subgraph "Storage"
            LS[Local Storage]
            OPFS[OPFS]
            IDB[IndexedDB]
        end
    end

    subgraph "Browser APIs"
        WA[Web APIs]
        SAB[SharedArrayBuffer]
        WEB[Web Workers API]
    end

    SF --> APP
    WF --> WW
    HD --> SAB

    APP --> DOM
    APP --> UI
    APP <--> WW

    WW --> WASM
    WASM --> LS
    WASM --> OPFS
    WASM --> IDB

    OPFS --> WA
    IDB --> WA
    WW --> WEB
    SAB --> WEB

    style SF fill:#e1f5fe
    style WW fill:#f3e5f5
    style WASM fill:#e8f5e8
```

## Package Diagram - File Structure

```mermaid
graph LR
    subgraph "Root Directory"
        HTML[index.html<br/>Main Application]
        DOC[DOCUMENTATION.md<br/>API Guide]
    end

    subgraph "CSS Package"
        CSS[styles.css<br/>Application Styling]
    end

    subgraph "JavaScript Package"
        MAIN[main.js<br/>Application Entry]
        DB[database-manager.js<br/>Core API]
        UI[ui-controller.js<br/>Interface Logic]
    end

    subgraph "WASM Package"
        WORKER[sqlite3-worker1.js<br/>Worker Script]
        WASM[sqlite3.wasm<br/>Binary Module]
        BUNDLE[sqlite3-bundler-friendly.mjs<br/>ES Module]
    end

    subgraph "Examples Package"
        EXAMPLES[Various demo files]
    end

    HTML --> CSS
    HTML --> MAIN
    MAIN --> DB
    MAIN --> UI
    DB --> WORKER
    WORKER --> WASM
    WORKER --> BUNDLE

    style HTML fill:#e1f5fe
    style DB fill:#f3e5f5
    style WORKER fill:#e8f5e8
```

## Entity Relationship Diagram - Sample Data Model

```mermaid
erDiagram
    USERS {
        integer id PK "PRIMARY KEY AUTOINCREMENT"
        text name "NOT NULL"
        text email "UNIQUE"
        text department
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
        datetime updated_at
    }

    POSTS {
        integer id PK "PRIMARY KEY AUTOINCREMENT"
        integer user_id FK "REFERENCES users(id)"
        text title "NOT NULL"
        text content
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
        datetime updated_at
    }

    TAGS {
        integer id PK "PRIMARY KEY AUTOINCREMENT"
        text name "UNIQUE NOT NULL"
        text description
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    POST_TAGS {
        integer post_id FK "REFERENCES posts(id)"
        integer tag_id FK "REFERENCES tags(id)"
        datetime created_at "DEFAULT CURRENT_TIMESTAMP"
    }

    USERS ||--o{ POSTS : "creates"
    POSTS ||--o{ POST_TAGS : "has"
    TAGS ||--o{ POST_TAGS : "applied_to"

    USERS {
        string sample_data "Engineering, Sales, Marketing departments"
        string indexes "idx_users_email, idx_users_department"
    }

    POSTS {
        string sample_data "Tech articles, announcements, tutorials"
        string indexes "idx_posts_user_id, idx_posts_created_at"
    }
```

## Network Sequence Diagram - File Loading

```mermaid
sequenceDiagram
    participant Browser as Browser
    participant Server as Web Server
    participant Worker as Web Worker
    participant WASM as SQLite WASM

    Browser->>Server: GET /index.html
    Server-->>Browser: HTML + COOP/COEP headers

    Browser->>Server: GET /css/styles.css
    Server-->>Browser: CSS stylesheet

    Browser->>Server: GET /js/main.js
    Server-->>Browser: Main application

    Browser->>Server: GET /js/database-manager.js
    Server-->>Browser: Database manager

    Browser->>Server: GET /js/ui-controller.js
    Server-->>Browser: UI controller

    Note over Browser: DOM loaded, scripts executed

    Browser->>Worker: new Worker('/jswasm/sqlite3-worker1.js')
    Worker->>Server: GET /jswasm/sqlite3.wasm
    Server-->>Worker: WASM binary
    Worker->>WASM: Instantiate WebAssembly
    WASM-->>Worker: Module initialized
    Worker-->>Browser: Worker ready

    Note over Browser,WASM: Application ready for use
```

## Performance Flow Diagram

```mermaid
flowchart TD
    Start([Performance Test Start]) --> CreateData[Create test data<br/>1000 records]
    CreateData --> MeasureInsert[Measure bulk INSERT<br/>performance]

    MeasureInsert --> CreateIndex[Create performance<br/>indexes]
    CreateIndex --> MeasureSelect[Measure SELECT<br/>queries]

    MeasureSelect --> MeasureJoin[Measure complex<br/>JOIN operations]
    MeasureJoin --> MeasureAggregate[Measure aggregate<br/>functions]

    MeasureAggregate --> MeasureTransaction[Test transaction<br/>performance]
    MeasureTransaction --> CalculateMetrics[Calculate throughput<br/>and timing metrics]

    CalculateMetrics --> Cleanup[Cleanup test data]
    Cleanup --> Results([Return performance results])

    style Start fill:#e1f5fe
    style Results fill:#e8f5e8

    MeasureInsert -.-> Stats1[Record timing stats]
    MeasureSelect -.-> Stats2[Record timing stats]
    MeasureJoin -.-> Stats3[Record timing stats]
    MeasureAggregate -.-> Stats4[Record timing stats]
    MeasureTransaction -.-> Stats5[Record timing stats]

    Stats1 --> CalculateMetrics
    Stats2 --> CalculateMetrics
    Stats3 --> CalculateMetrics
    Stats4 --> CalculateMetrics
    Stats5 --> CalculateMetrics
```

---

## Legend

-   **Components**: Major functional units
-   **Sequences**: Time-ordered interactions
-   **States**: System state transitions
-   **Classes**: Object-oriented structure
-   **Activities**: Process workflows
-   **Deployment**: Runtime environment
-   **Packages**: Code organization
-   **Entities**: Data relationships
-   **Performance**: Benchmark workflows

These diagrams provide a comprehensive view of the SQLite WASM architecture, API design, and usage patterns for developers integrating with the system.
