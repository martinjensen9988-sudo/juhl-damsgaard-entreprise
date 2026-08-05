import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;
    const userEmail = user.email;
    const svc = base44.asServiceRole;
    const deleted = {};

    // Wipe personal data owned by the user across entities.
    // Each deleteMany is best-effort; RLS or missing collections should not abort the flow.
    const personalEntities = ['TimeEntry', 'Expense', 'InternalMessage', 'CustomerFeedback'];
    for (const name of personalEntities) {
      try {
        const res = await svc.entities[name].deleteMany({ created_by_id: userId });
        deleted[name] = res?.deleted_count ?? res?.count ?? 'ok';
      } catch (e) {
        deleted[name] = `skipped: ${e.message}`;
      }
    }

    // Tasks assigned to the user (assigned_user_id, not ownership)
    try {
      const res = await svc.entities.Task.deleteMany({ assigned_user_id: userId });
      deleted['Task'] = res?.deleted_count ?? res?.count ?? 'ok';
    } catch (e) {
      deleted['Task'] = `skipped: ${e.message}`;
    }

    // Customer-facing records tied to this email (quotes, portal documents, feedback)
    if (userEmail) {
      try {
        const res = await svc.entities.Quote.deleteMany({ customer_email: userEmail });
        deleted['Quote'] = res?.deleted_count ?? res?.count ?? 'ok';
      } catch (e) {
        deleted['Quote'] = `skipped: ${e.message}`;
      }
      try {
        const res = await svc.entities.ProjectDocument.deleteMany({ customer_email: userEmail });
        deleted['ProjectDocument'] = res?.deleted_count ?? res?.count ?? 'ok';
      } catch (e) {
        deleted['ProjectDocument'] = `skipped: ${e.message}`;
      }
    }

    // Finally, attempt to remove the user account itself (service role).
    let userRemoved = false;
    try {
      await svc.entities.User.delete(userId);
      userRemoved = true;
    } catch (e) {
      deleted['User'] = `skipped: ${e.message}`;
    }

    return Response.json({
      success: true,
      userId,
      userRemoved,
      deleted,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}