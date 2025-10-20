import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { generateImage, editImage } from "./gemini";
import { createImage, getUserImages, updateImageStatus } from "./db";
import { storagePut } from "./storage";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { images as imagesTable } from "../drizzle/schema";
import { getDb } from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  images: router({
    generate: protectedProcedure
      .input(z.object({
        prompt: z.string().min(1, "Prompt is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const imageId = crypto.randomUUID();
        
        try {
          // Create initial record with pending status
          await createImage({
            id: imageId,
            userId: ctx.user.id,
            prompt: input.prompt,
            imageUrl: "",
            type: "generate",
            status: "pending",
          });

          // Generate image using Gemini
          const { imageData } = await generateImage(input.prompt);

          // Upload to S3
          const { url } = await storagePut(
            `images/${ctx.user.id}/${imageId}.png`,
            imageData,
            "image/png"
          );

          // Update record with completed status and image URL
          const db = await getDb();
          if (db) {
            await db.update(imagesTable).set({ 
              imageUrl: url,
              status: "completed",
              updatedAt: new Date(),
            }).where(eq(imagesTable.id, imageId));
          }

          return {
            id: imageId,
            imageUrl: url,
            prompt: input.prompt,
            status: "completed",
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await updateImageStatus(imageId, "failed", errorMessage);
          throw error;
        }
      }),

    edit: protectedProcedure
      .input(z.object({
        imageUrl: z.string().url("Invalid image URL"),
        prompt: z.string().min(1, "Prompt is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const imageId = crypto.randomUUID();
        
        try {
          // Create initial record with pending status
          await createImage({
            id: imageId,
            userId: ctx.user.id,
            prompt: input.prompt,
            imageUrl: "",
            originalImageUrl: input.imageUrl,
            type: "edit",
            status: "pending",
          });

          // Edit image using Gemini
          const { imageData } = await editImage(input.imageUrl, input.prompt);

          // Upload to S3
          const { url } = await storagePut(
            `images/${ctx.user.id}/${imageId}.png`,
            imageData,
            "image/png"
          );

          // Update record with completed status and image URL
          const db = await getDb();
          if (db) {
            await db.update(imagesTable).set({ 
              imageUrl: url,
              status: "completed",
              updatedAt: new Date(),
            }).where(eq(imagesTable.id, imageId));
          }

          return {
            id: imageId,
            imageUrl: url,
            prompt: input.prompt,
            status: "completed",
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await updateImageStatus(imageId, "failed", errorMessage);
          throw error;
        }
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserImages(ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;

