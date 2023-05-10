import express from 'express';
import { Virhe } from '../errors/virhekasittelija';
import { PrismaClient } from '@prisma/client';

const prisma : PrismaClient = new PrismaClient();

const apiTilauksetRouter : express.Router = express.Router();

apiTilauksetRouter.use(express.json());

apiTilauksetRouter.get("/:id", async (req : express.Request, res : express.Response, next : express.NextFunction) => {

     try {

        if (await prisma.tilaus.count({
            where : {
                id : Number(req.params.id)
            }
        }) === 1) {
            res.json(await prisma.tilaus.findUnique({
                where : {
                    id : Number(req.params.id)
                }
            }))
        } else {
            next(new Virhe(400, "Virheelinen id"));
        }
        
    } catch (e: any) {
        next(new Virhe());
    }
});

apiTilauksetRouter.get("/", async (req : express.Request, res : express.Response, next : express.NextFunction) => {

    try {
        res.json(await prisma.tilaus.findMany());
    } catch (e : any) {
        next(new Virhe());
    }
});

export default apiTilauksetRouter;