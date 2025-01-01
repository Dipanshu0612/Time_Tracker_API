import {
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";

export interface Database {
  user_data: UserData;
  time_entries: TimeEntries;
  projects: Projects;
  proj_tasks: ProjectTasks;
}

export interface UserData {
  user_id: Generated<number>;
  Name: string;
  Email_ID: string;
  Password: string;
}

export type User = Selectable<UserData>;
export type NewUser = Insertable<UserData>;
export type UpdateUser = Updateable<UserData>;

export interface TimeEntries {
  entry_id: Generated<number>;
  project_id: number;
  task_id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  description: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export type Time_Entry = Selectable<TimeEntries>;
export type NewTime_Entry = Insertable<TimeEntries>;
export type UpdateTime_Entry = Updateable<TimeEntries>;


export interface Projects {
  project_id: Generated<number>;
  user_id: number;
  name: string;
  description: string;
  status: "active" | "completed" | "archived";
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export type Project = Selectable<Projects>;
export type NewProject = Insertable<Projects>;
export type UpdateProject = Updateable<Projects>;


export interface ProjectTasks {
  task_id: Generated<number>;
  project_id: number;
  user_id: number;
  task_description: string;
  status: string | "Ongoing";
  start_time: string;
  end_time: string;
  created_at: Generated<string>;
}

export type ProjectTask = Selectable<ProjectTasks>;
export type NewProjectTask = Insertable<ProjectTasks>;
export type UpdateProjectTask = Updateable<ProjectTasks>;

