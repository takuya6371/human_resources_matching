import { base44 } from "@/api/base44Client";

export async function notify({ userId, actorId, actorName, actorType, type, title, body, targetType, targetId }) {
  if (!userId || !type || !title) return;
  if (actorId && actorId === userId) return; // don't notify self
  try {
    await base44.entities.Notification.create({
      user_id: userId, actor_id: actorId || null, actor_name: actorName || "", actor_type: actorType || "system",
      type, title, body: body || "", target_type: targetType || null, target_id: targetId || null, read: false,
    });
  } catch {}
}