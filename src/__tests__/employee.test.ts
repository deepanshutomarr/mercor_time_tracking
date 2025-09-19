import request from 'supertest';
import app from '../index';
import mongoose from 'mongoose';
import Employee from '../models/Employee';
import Team from '../models/Team';
import SharedSettings from '../models/SharedSettings';

describe('Employee API', () => {
  let teamId: string;
  let sharedSettingsId: string;

  beforeEach(async () => {
    // Create test team
    const team = new Team({
      name: 'Test Team',
      description: 'Test team description'
    });
    await team.save();
    teamId = team._id.toString();

    // Create test shared settings
    const sharedSettings = new SharedSettings({
      name: 'Test Settings',
      screenshotSettings: {
        screenshotEnabled: true,
        interval: 300000,
        quality: 80,
        maxSize: '1920x1080'
      },
      timeTrackingSettings: {
        allowManualTimeEntry: true,
        requireDescription: false,
        autoStartBreak: false,
        breakDuration: 15,
        maxDailyHours: 12,
        minSessionDuration: 1
      }
    });
    await sharedSettings.save();
    sharedSettingsId = (sharedSettings._id as mongoose.Types.ObjectId).toString();
  });

  describe('POST /api/v1/employee', () => {
    it('should create a new employee', async () => {
      const employeeData = {
        name: 'John Doe',
        email: 'john@example.com',
        teamId,
        sharedSettingsId
      };

      const response = await request(app)
        .post('/api/v1/employee')
        .send(employeeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(employeeData.name);
      expect(response.body.data.email).toBe(employeeData.email);
    });

    it('should return 400 if email already exists', async () => {
      const employeeData = {
        name: 'John Doe',
        email: 'john@example.com',
        teamId,
        sharedSettingsId
      };

      // Create first employee
      await request(app)
        .post('/api/v1/employee')
        .send(employeeData)
        .expect(201);

      // Try to create second employee with same email
      await request(app)
        .post('/api/v1/employee')
        .send(employeeData)
        .expect(400);
    });

    it('should return 400 if team does not exist', async () => {
      const employeeData = {
        name: 'John Doe',
        email: 'john@example.com',
        teamId: 'invalid-team-id',
        sharedSettingsId
      };

      await request(app)
        .post('/api/v1/employee')
        .send(employeeData)
        .expect(404);
    });
  });

  describe('GET /api/v1/employee', () => {
    it('should return list of employees', async () => {
      // Create test employees
      const employee1 = new Employee({
        name: 'John Doe',
        email: 'john@example.com',
        teamId,
        sharedSettingsId
      });
      await employee1.save();

      const employee2 = new Employee({
        name: 'Jane Smith',
        email: 'jane@example.com',
        teamId,
        sharedSettingsId
      });
      await employee2.save();

      const response = await request(app)
        .get('/api/v1/employee')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/v1/employee/:id', () => {
    it('should return employee by id', async () => {
      const employee = new Employee({
        name: 'John Doe',
        email: 'john@example.com',
        teamId,
        sharedSettingsId
      });
      await employee.save();

      const response = await request(app)
        .get(`/api/v1/employee/${employee._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(employee.name);
    });

    it('should return 404 if employee not found', async () => {
      await request(app)
        .get('/api/v1/employee/invalid-id')
        .expect(404);
    });
  });
});
