import { useEffect, useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export function useMaNotifications() {
  const [user, setUser] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadTasks, setUnreadTasks] = useState(0);
  const [permission, setPermission] = useState('default');
  const notified = useRef(new Set());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    if ('Notification' in window) setPermission(Notification.permission);
  }, []);

  const fire = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(title, { body }); } catch {}
    }
  };

  const process = useCallback(async () => {
    if (!user) return;
    const [msgs, tasks, reads] = await Promise.all([
      base44.entities.InternalMessage.list('-created_date', 50).catch(() => []),
      base44.entities.Task.list('-created_date', 100).catch(() => []),
      base44.entities.NotificationRead.filter({ user_id: user.id }, '-created_date', 500).catch(() => []),
    ]);
    const incoming = (msgs || []).filter((m) => m.recipient_user_id === user.id);
    const myTasks = (tasks || []).filter((t) => t.assigned_user_id === user.id && t.status !== 'Gennemført');
    const readMsgs = new Set((reads || []).filter((r) => r.item_type === 'message').map((r) => r.item_id));
    const readTasks = new Set((reads || []).filter((r) => r.item_type === 'task').map((r) => r.item_id));

    setUnreadMessages(incoming.filter((m) => !readMsgs.has(m.id)).length);
    setUnreadTasks(myTasks.filter((t) => !readTasks.has(t.id)).length);

    incoming.forEach((m) => {
      if (!notified.current.has(m.id) && !readMsgs.has(m.id)) {
        notified.current.add(m.id);
        fire('Ny besked fra kontoret', m.title || '');
      }
    });
    myTasks.forEach((t) => {
      if (!notified.current.has(t.id) && !readTasks.has(t.id)) {
        notified.current.add(t.id);
        fire('Ny opgave fra kontoret', t.title || '');
      }
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    process();
    const u1 = base44.entities.InternalMessage.subscribe(() => process());
    const u2 = base44.entities.Task.subscribe(() => process());
    return () => { u1(); u2(); };
  }, [user, process]);

  const markMessagesRead = useCallback(async () => {
    if (!user) return;
    const [msgs, reads] = await Promise.all([
      base44.entities.InternalMessage.list('-created_date', 50).catch(() => []),
      base44.entities.NotificationRead.filter({ user_id: user.id, item_type: 'message' }, '-created_date', 500).catch(() => []),
    ]);
    const existing = new Set((reads || []).map((r) => r.item_id));
    const ids = (msgs || []).filter((m) => m.recipient_user_id === user.id).map((m) => m.id);
    const rows = ids
      .filter((id) => !existing.has(id))
      .map((id) => ({ user_id: user.id, item_type: 'message', item_id: id, read_at: new Date().toISOString() }));
    if (rows.length) await base44.entities.NotificationRead.bulkCreate(rows).catch(() => null);
    setUnreadMessages(0);
  }, [user]);

  const markTasksRead = useCallback(async () => {
    if (!user) return;
    const [tasks, reads] = await Promise.all([
      base44.entities.Task.list('-created_date', 100).catch(() => []),
      base44.entities.NotificationRead.filter({ user_id: user.id, item_type: 'task' }, '-created_date', 500).catch(() => []),
    ]);
    const existing = new Set((reads || []).map((r) => r.item_id));
    const ids = (tasks || []).filter((t) => t.assigned_user_id === user.id).map((t) => t.id);
    const rows = ids
      .filter((id) => !existing.has(id))
      .map((id) => ({ user_id: user.id, item_type: 'task', item_id: id, read_at: new Date().toISOString() }));
    if (rows.length) await base44.entities.NotificationRead.bulkCreate(rows).catch(() => null);
    setUnreadTasks(0);
  }, [user]);

  const requestPermission = useCallback(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then((p) => setPermission(p));
    }
  }, []);

  return { unreadMessages, unreadTasks, markMessagesRead, markTasksRead, requestPermission, permission };
}
