import { Document, Model } from 'mongoose';
import { Team } from './index';

export interface TeamModel extends Model<TeamDocument> {
  findByName(name: string): Promise<TeamDocument | null>;
}

export interface TeamDocument extends Team, Document {
  addMember(employeeId: string): Promise<TeamDocument>;
  removeMember(employeeId: string): Promise<TeamDocument>;
}
