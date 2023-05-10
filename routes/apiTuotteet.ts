import express from 'express';
import { Virhe } from '../errors/virhekasittelija';
import { PrismaClient } from '@prisma/client';

const prisma : PrismaClient = new PrismaClient();

const apiTuotteetRouter : express.Router = express.Router();

apiTuotteetRouter.use(express.json());

apiTuotteetRouter.get("/:id", async (req : express.Request, res : express.Response, next : express.NextFunction) => {

     try {

        if (await prisma.tuote.count({
            where : {
                id : Number(req.params.id)
            }
        }) === 1) {
            res.json(await prisma.tuote.findUnique({
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

apiTuotteetRouter.get("/", async (req : express.Request, res : express.Response, next : express.NextFunction) => {

    try {
        res.json(await prisma.tuote.findMany());
    } catch (e : any) {
        next(new Virhe());
    }
});

apiTuotteetRouter.post("/", async (req : express.Request, res : express.Response, next : express.NextFunction) => {
 
    if (req.body.kommentti?.length > 0) {
      try {
          await prisma.tuote.create({
            data:{
                nimi : req.body.nimi,
                hinta : req.body.hinta
                }});
  
      } catch (e : any) {
          next(new Virhe())
      }

  } else {
      next(new Virhe(400, "Virheellinen pyynnön body"));
  } 

});

export default apiTuotteetRouter;