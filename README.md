# Time Tracker API

A RESTful API designed to help freelancers track time spent on various projects and generate work summaries. The API includes user management, project tracking, and time tracking functionalities.

## 💻 Tech Stack:
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens) ![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white) ![Nodemon](https://img.shields.io/badge/NODEMON-%23323330.svg?style=for-the-badge&logo=nodemon&logoColor=%BBDEAD) ![MySQL](https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white) ![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)


## Features

- User registration and authentication with JWT tokens.
- Project management (Create, Get, Delete and Update Projects).
- Create tasks for specific projects
- Track time spent on tasks and projects with timestamps.
- Generate detailed project summaries and export them as CSV files.

## API Endpoints

### 1. Home
   - **URL:** `GET /`
   - **Description:** Displays the home page with a message detailing the project and available routes in JSON format.

### 2. Add User
   - **URL:** `POST /add-user`
   - **Description:** Registers a new user in the database and returns the user ID for future requests.
   - **Required Fields:**
     - `Name`: The user's full name.
     - `Email_ID`: The user's email address.
     - `Password`: The user's password.

### 3. Verify User
   - **URL:** `POST /verify-user`
   - **Description:** Verifies the user credentials and returns a JWT token for authorized access.
   - **Required Fields:**
     - `user_id`: The user ID.
     - `Password`: The user's password.

### 4. Create Project
   - **URL:** `POST /create-project`
   - **Description:** Creates a new project and adds it to the database.
   - **Required Fields:**
     - `user_id`: The ID of the user creating the project.
     - `name`: The name of the project.
     - `description`: A brief description of the project.
     - `status`: The current status of the project (e.g., active, completed).

### 5. Get Project
   - **URL:** `GET /get-project/:project_id`
   - **Description:** Retrieves the details of a project based on its ID.
   - **Required Fields:** 
     - `project_id`: The ID of the project.

### 6. Delete a Project
   - **URL:** `DELETE /delete-project`
   - **Description:** Deletes the project with the specified ID from the database.
   - **Required Fields:**
     - `project_id`: The ID of the project to delete.
    
### 7. Create Task
   - **URL:** `POST /create-project-task`
   - **Description:** Creates a task for a specific project in the database.
   - **Required Fields:**
      - `project_id`: The ID of the project.
      - `task_description`: The description of the task.
      - `start_time`: The start time for the task.
      - `end_time`: End time for the task.
    
### 8. View Task
   - **URL:** `GET /get-project/:project_id/tasks`
   - **Description:** Gets the details of the tasks on the specific project.
   - **Required Fields:**
      - `project_id`: The ID of the project.
    
### 9. View Task by ID
   - **URL:** `GET /get-project/:project_id/tasks/:task_id`
   - **Description:** Gets the details of the specific task on the specific project.
   - **Required Fields:**
      - `project_id`: The ID of the project.
      - `task_id`: The ID of the task to get.

### 10. Update Task by ID
   - **URL:** `PUT /get-project/:project_id/tasks/:task_id`
   - **Description:** Updates the details of the specific task on the specific project.
   - **Optional Fields (At least one required):**
      - `description`: Change the description of the task.
      - `start_time`: Change the start time of the project.
      - `end_time`: Change the end time of the project.
      - `status`: Change the status of the project.
     
### 11. Add Timestamp
   - **URL:** `POST /project-task-timestamp`
   - **Description:** Adds a timestamp (start and end time) to track the time spent on a task in specific project.
   - **Required Fields:**
     - `project_id`: The ID of the project.
     - `task_id`: The ID of the task to which the timestamp is added.
     - `start_time`: The start time of the task.
     - `end_time`: The end time of the task.
     - `description`: A brief description of the task.

### 12. Get Summary of All Projects
   - **URL:** `GET /get-summary`
   - **Description:** Generates a summary of all projects, including their details and the total time worked on each. The summary is returned as a downloadable CSV file.

### 13. Get Summary of Specific Project
   - **URL:** `GET /get-summary/:project_id`
   - **Description:** Generates a summary for a specific project, including the project details and the total time worked. The summary is returned as a downloadable CSV file.
   - **Required Fields:**
     - `project_id`: The ID of the project.

### 14. View the API Documentation through Swagger
   - **URL:** `GET /api-docs`
   - **Description:** Generates a Swagger UI Interface showcasing the documentaion of all the APIs of the project.

## Authentication

- Authentication for certain routes requires a valid JWT token, which is issued when the user logs in and verified with each request to secure endpoints.

## Setup Instructions

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
3. Run the server
   ```bash
   npm run dev

### View the API Documentation
https://timetrackingtool.apidocumentation.com/
