## 1. Backend — Include user role in project list

- [ ] 1.1 Modify `getProjects()` in `lib/db/projects.js` to fetch user's role per project for non-admin users, and inject `userRole` into each returned project (admin users get `userRole: "admin"`)

## 2. Frontend — Conditionally hide delete in ProjectCard

- [ ] 2.1 In `components/home/ProjectCard.js`, use `project.userRole` to conditionally render the delete menu item (show only if `userRole === 'owner'` or `userRole === 'admin'`)

## 3. Verify

- [ ] 3.1 Start dev server, log in as viewer, confirm delete option hidden in project card menu
- [ ] 3.2 Log in as owner, confirm delete option visible
- [ ] 3.3 Log in as admin, confirm delete option visible for all projects
