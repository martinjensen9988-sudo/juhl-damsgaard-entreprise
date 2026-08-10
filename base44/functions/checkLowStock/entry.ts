import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Hent alle lagervarer
    const items = await base44.asServiceRole.entities.InventoryItem.list();

    // Find varer under minimumsniveau
    const lowStock = items.filter((item) => {
      const stock = Number(item.stock_quantity) || 0;
      const min = Number(item.min_stock_level) || 0;
      return stock <= min;
    });

    // Kritiske varer: helt tømte (0) eller under halvdelen af minimum
    const critical = lowStock.filter((item) => {
      const stock = Number(item.stock_quantity) || 0;
      const min = Number(item.min_stock_level) || 0;
      return stock === 0 || (min > 0 && stock <= min / 2);
    });

    if (lowStock.length === 0) {
      return Response.json({ success: true, lowStockCount: 0, criticalCount: 0, message: 'Alle lagerniveauer er OK' });
    }

    // Hent admin-brugere der skal have besked
    let adminEmails = [];
    try {
      const users = await base44.asServiceRole.entities.User.list();
      adminEmails = users.filter((u) => u.role === 'admin' && u.email).map((u) => u.email);
    } catch (e) { /* ignorer */ }

    let emailsSent = 0;
    if (adminEmails.length > 0) {
      const lines = lowStock.map((i) => {
        const stock = Number(i.stock_quantity) || 0;
        const min = Number(i.min_stock_level) || 0;
        const isCritical = stock === 0 || (min > 0 && stock <= min / 2);
        const flag = isCritical ? '⚠️ KRITISK' : 'Lav';
        const sup = i.supplier_name ? ` | Leverandør: ${i.supplier_name}` : '';
        return `- [${flag}] ${i.name}: ${stock} ${i.unit || 'stk'} (min. ${min})${sup}`;
      }).join('\n');

      const subject = `Lageradvarsel: ${lowStock.length} ${lowStock.length === 1 ? 'vare' : 'varer'} under minimumsniveau`;
      const body = [
        'Hej,',
        '',
        `Dette er en automatisk påmindelse fra lagerovervågningen.`,
        '',
        critical.length > 0
          ? `⚠️ ${critical.length} ${critical.length === 1 ? 'vare er' : 'varer er'} KRITISK lav(t) og skal genbestilles med det samme.`
          : '',
        lowStock.length > 0
          ? `Følgende ${lowStock.length} ${lowStock.length === 1 ? 'vare er' : 'varer er'} under det fastsatte minimumsniveau:`
          : '',
        '',
        lines,
        '',
        'Log ind i systemet under "Lageroverblik" for at oprette indkøbsordre eller opdatere beholdningen.',
        '',
        'Med venlig hilsen,',
        'Juhl & Damsgaard Entreprise — Automatisk lagerovervågning',
      ].join('\n');

      for (const email of adminEmails) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body });
          emailsSent++;
        } catch (e) { /* ignorer enkelte fejl */ }
      }
    }

    // Log til aktivitetslog
    try {
      await base44.asServiceRole.entities.ActivityLog.create({
        entity_type: 'Lager',
        entity_id: '',
        entity_name: 'Lagerovervågning',
        action: 'Lageradvarsel',
        user_email: '',
        user_name: 'System',
        details: `${lowStock.length} varer under minimum (${critical.length} kritiske)`,
      });
    } catch (e) { /* log må fejle uden at afbryde */ }

    return Response.json({
      success: true,
      lowStockCount: lowStock.length,
      criticalCount: critical.length,
      emailsSent,
      items: lowStock.map((i) => ({
        name: i.name,
        category: i.category,
        stock: Number(i.stock_quantity) || 0,
        min: Number(i.min_stock_level) || 0,
        unit: i.unit,
        supplier: i.supplier_name,
        location: i.location,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
