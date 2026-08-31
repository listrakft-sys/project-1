import { Request, Response } from 'express';
import { CalendarService, CreateEventInput, UpdateEventInput } from './calendar.service';
import { ApiError } from '../../utils/apiResponse';

export class CalendarController {
  static async getEvents(req: Request, res: Response) {
    const events = await CalendarService.getEvents(req.user!, req.query as Record<string, string>);
    res.json({ data: events });
  }

  static async getEventById(req: Request, res: Response) {
    const event = await CalendarService.getEventById(req.params.id);
    res.json({ data: event });
  }

  static async createEvent(req: Request, res: Response) {
    const body = req.body as CreateEventInput;
    if (!body.title || !body.startDate) {
      throw new ApiError(400, 'BAD_REQUEST', 'Title and startDate are required');
    }
    const event = await CalendarService.createEvent(req.user!, body);
    res.status(201).json({ data: event });
  }

  static async updateEvent(req: Request, res: Response) {
    const body = req.body as UpdateEventInput;
    const event = await CalendarService.updateEvent(req.user!, req.params.id, body);
    res.json({ data: event });
  }

  static async deleteEvent(req: Request, res: Response) {
    const result = await CalendarService.deleteEvent(req.user!, req.params.id);
    res.json({ data: result });
  }
}
