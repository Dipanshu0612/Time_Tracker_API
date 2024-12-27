# Time Tracker API

A RESTful API designed to help freelancers track time spent on various projects and generate work summaries. The API includes user management, project tracking, and time tracking functionalities.

## Features

- User registration and authentication with JWT tokens.
- Project management (Create, Get, Delete Projects).
- Track time spent on projects with timestamps.
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

### 7. Add Timestamp
   - **URL:** `POST /project-timestamp`
   - **Description:** Adds a timestamp (start and end time) to track the time spent on a specific project.
   - **Required Fields:**
     - `project_id`: The ID of the project.
     - `user_id`: The ID of the user adding the timestamp.
     - `start_time`: The start time of the task.
     - `end_time`: The end time of the task.
     - `description`: A brief description of the task.

### 8. Get Summary of All Projects
   - **URL:** `GET /get-summary`
   - **Description:** Generates a summary of all projects, including their details and the total time worked on each. The summary is returned as a downloadable CSV file.

### 9. Get Summary of Specific Project
   - **URL:** `GET /get-summary/:project_id`
   - **Description:** Generates a summary for a specific project, including the project details and the total time worked. The summary is returned as a downloadable CSV file.
   - **Required Fields:**
     - `project_id`: The ID of the project.

## Authentication

- Authentication for certain routes requires a valid JWT token, which is issued when the user logs in and verified with each request to secure endpoints.

## Setup Instructions

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
