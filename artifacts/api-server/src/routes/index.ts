import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import participantsRouter from "./participants";
import availabilitiesRouter from "./availabilities";
import activitiesRouter from "./activities";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(participantsRouter);
router.use(availabilitiesRouter);
router.use(activitiesRouter);

export default router;
