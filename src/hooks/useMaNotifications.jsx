import { useEffect, useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

const READ_MSG_KEY = 'ma_read_msgs';
const READ_TASK_KEY = 'ma_read_tasks';

function getRead(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
}
function setRead(key, ids) {
  try { localStorage.setItem(key, JSON.stringify([...ids])); } catch {}
}

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
    const [msgs, tasks] = await Promise.all([
      base44.entities.InternalMessage.list('-created_date', 50).catch(() => []),
      base44.entities.Task.list('-created_date', 100).catch(() => []),
    ]);
    const incoming = (msgs || []).filter((m) => m.recipient_user_id === user.id);
    const myTasks = (tasks || []).filter((t) => t.assigned_user_id === user.id && t.status !== 'Gennemført');
    const readMsgs = getRead(READ_MSG_KEY);
    const readTasks = getRead(READ_TASK_KEY);

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
    const msgs = await base44.entities.InternalMessage.list('-created_date', 50).catch(() => []);
    const ids = (msgs || []).filter((m) => m.recipient_user_id === user.id).map((m) => m.id);
    setRead(READ_MSG_KEY, ids);
    setUnreadMessages(0);
  }, [user]);

  const markTasksRead = useCallback(async () => {
    if (!user) return;
    const tasks = await base44.entities.Task.list('-created_date', 100).catch(() => []);
    const ids = (tasks || []).filter((t) => t.assigned_user_id === user.id).map((t) => t.id);
    setRead(READ_TASK_KEY, ids);
    setUnreadTasks(0);
  }, [user]);

  const requestPermission = useCallback(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then((p) => setPermission(p));
    }
  }, []);

  return { unreadMessages, unreadTasks, markMessagesRead, markTasksRead, requestPermission, permission };
}