import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userName = user.full_name || user.email;

    const [tasks, timeEntries, assignments, allProjects] = await Promise.all([
      base44.asServiceRole.entities.Task.filter({ assigned_to: userName }),
      base44.asServiceRole.entities.TimeEntry.filter({ user_name: userName }),
      base44.asServiceRole.entities.Assignment.filter({ employee_name: userName }),
      base44.asServiceRole.entities.Project.list('-created_date', 200),
    ]);

    // Byg projektmappe fra tildelinger og tidsregistreringer
    const projectMap = {};
    [...assignments, ...timeEntries].forEach((item) => {
      if (item.project_id && !projectMap[item.project_id]) {
        const proj = allProjects.find((p) => p.id === item.project_id);
        projectMap[item.project_id] = {
          id: item.project_id,
          name: item.project_name || proj?.name || '—',
          status: proj?.status || '—',
          address: proj?.address || '',
          start_date: proj?.start_date || '',
          end_date: proj?.end_date || '',
        };
      }
    });

    // Tilføj timer per projekt
    Object.keys(projectMap).forEach((pid) => {
      projectMap[pid].hours = timeEntries
        .filter((t) => t.project_id === pid)
        .reduce((s, t) => s + (Number(t.hours) || 0), 0);
    });

    const myProjects = Object.values(projectMap);
    const activeProjects = myProjects.filter((p) => p.status === 'I gang');
    const openTasks = tasks.filter((t) => t.status !== 'Gennemført');
    const totalHours = timeEntries.reduce((s, t) => s + (Number(t.hours) || 0), 0);

    return Response.json({
      user: { full_name: user.full_name, email: user.email, role: user.role },
      tasks: openTasks,
      projects: myProjects,
      activeProjects,
      totalHours,
      taskCount: openTasks.length,
      projectCount: activeProjects.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}