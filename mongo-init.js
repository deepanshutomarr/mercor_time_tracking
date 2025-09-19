// MongoDB initialization script
db = db.getSiblingDB('mercor-time-tracking');

// Create collections with validation
db.createCollection('employees', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'teamId', 'sharedSettingsId'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 100
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        teamId: {
          bsonType: 'string'
        },
        sharedSettingsId: {
          bsonType: 'string'
        },
        isActive: {
          bsonType: 'bool'
        }
      }
    }
  }
});

db.createCollection('projects', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'employees'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 200
        },
        employees: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          }
        },
        billable: {
          bsonType: 'bool'
        }
      }
    }
  }
});

db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'projectId', 'employees'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 200
        },
        projectId: {
          bsonType: 'string'
        },
        employees: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          }
        }
      }
    }
  }
});

db.createCollection('timeentries', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['employeeId', 'projectId', 'taskId', 'startTime', 'isActive'],
      properties: {
        employeeId: {
          bsonType: 'string'
        },
        projectId: {
          bsonType: 'string'
        },
        taskId: {
          bsonType: 'string'
        },
        startTime: {
          bsonType: 'date'
        },
        isActive: {
          bsonType: 'bool'
        }
      }
    }
  }
});

db.createCollection('screenshots', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['employeeId', 'timeEntryId', 'projectId', 'taskId', 'filePath', 'fileName'],
      properties: {
        employeeId: {
          bsonType: 'string'
        },
        timeEntryId: {
          bsonType: 'string'
        },
        projectId: {
          bsonType: 'string'
        },
        taskId: {
          bsonType: 'string'
        },
        filePath: {
          bsonType: 'string'
        },
        fileName: {
          bsonType: 'string'
        }
      }
    }
  }
});

// Create indexes for better performance
db.employees.createIndex({ email: 1 }, { unique: true });
db.employees.createIndex({ teamId: 1 });
db.employees.createIndex({ isActive: 1 });

db.projects.createIndex({ name: 1 });
db.projects.createIndex({ employees: 1 });
db.projects.createIndex({ archived: 1 });

db.tasks.createIndex({ projectId: 1 });
db.tasks.createIndex({ employees: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ priority: 1 });

db.timeentries.createIndex({ employeeId: 1 });
db.timeentries.createIndex({ projectId: 1 });
db.timeentries.createIndex({ taskId: 1 });
db.timeentries.createIndex({ startTime: -1 });
db.timeentries.createIndex({ isActive: 1 });

db.screenshots.createIndex({ employeeId: 1 });
db.screenshots.createIndex({ timeEntryId: 1 });
db.screenshots.createIndex({ projectId: 1 });
db.screenshots.createIndex({ taskId: 1 });
db.screenshots.createIndex({ takenAt: -1 });

print('Database initialized successfully');
