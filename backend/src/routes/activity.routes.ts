/**
 * Activity Feed Routes
 * REST endpoints for activity logging and retrieval
 */

import { Router, Request, Response } from 'express';
import { activityService } from '../services/activity.service';

const router = Router();

/**
 * GET /api/activity
 * Get paginated activity feed with optional filters
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const filters = {
      resourceType: req.query.resourceType as string | undefined,
      actorId: req.query.actorId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      search: req.query.search as string | undefined,
    };

    const result = activityService.getActivityFeed(page, pageSize, filters);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});

/**
 * POST /api/activity
 * Log a new activity event
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const event = activityService.logEvent(req.body);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error logging activity event:', error);
    res.status(500).json({ error: 'Failed to log activity event' });
  }
});

/**
 * GET /api/activity/stats
 * Get activity statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const allEvents = activityService.getAllEvents();
    
    const stats = {
      total: allEvents.length,
      byResourceType: {} as Record<string, number>,
      byActor: {} as Record<string, number>,
      recentActivity: allEvents.slice(0, 5),
    };

    // Count by resource type
    allEvents.forEach(event => {
      stats.byResourceType[event.resourceType] = 
        (stats.byResourceType[event.resourceType] || 0) + 1;
    });

    // Count by actor
    allEvents.forEach(event => {
      stats.byActor[event.actor.name] = 
        (stats.byActor[event.actor.name] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ error: 'Failed to fetch activity stats' });
  }
});

export default router;
