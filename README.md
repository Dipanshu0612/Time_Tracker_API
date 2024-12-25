# Time_Tracker_API
A RESTful API to help freelancers track time spent on projects and generate work summaries.

## API Endpoints

### 1. Home
   - **URL:** `GET /`
   - **Description:** Displays the home page with a message detailing the project and the available routes in JSON Format.

### 2. Add User
   - **URL:** `POST /add-user`
   - **Description:** Adds a user in the database and returns the id of the user for future requests.
   - **Required Fields:** `Name`, `Email_ID`, `Password`

### 3. Verify User
   - **URL:** `POST /verify-user`
   - **Description:** Verifies the user credentials and assigns a JWT Token for authorization.
   - **Required Fields:** `user_id`, `Password`

### 4. Create Project
   - **URL:** `POST /create-project`
   - **Description:** Adds a project in the database.
   - **Required Fields:** `user_id`, `name`, `description`, `status`

### 5. Get Project
   - **URL:** `GET /get-project/:project_id`
   - **Description:** Gets the project with the id from the database.
   - **Required Fields:** `project_id`

### 6. Delete a Project
   - **URL:** `DELETE /delete-project`
   - **Description:** Deletes the project with the specified id.
   - **Required Fields:** `project_id`

### 7. Add Timestamp
   - **URL:** `POST /project-timestamp`
   - **Description:** Adds a timestamp on the specified project.
   - **Required Fields:** `project_id`, `user_id`, `start_time`, `end_time`, `description`

### 8. Get Summary of All Projects
   - **URL:** `GET /get-summary`
   - **Description:** Generated the summary of all the projects including their details and total time worked on the project and outputs a CSV File which is downloadable.

### 9. Get Summary of Specific Project
   - **URL:** `GET /get-summary/:project_id`
   - **Description:** Generated the summary of the projects with the specified ID including its details and total time worked on the project and outputs a CSV File which is downloadable.
   - **Required Fields:** `project_id`


