import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  // 1) Create a user
  createUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.users.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const newUser = await ctx.db.users.create({
        data: {
          id: crypto.randomUUID(),
          name: input.name,
          email: input.email,
          phone: input.phone,
          password_hash: hashedPassword,
          created_at: new Date(),
        },
      });

      return { user_id: newUser.id, message: "User created successfully" };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.users.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        return { success: false, message: "Invalid email or password" };
      }

      const isValid = await bcrypt.compare(input.password, user.password_hash);

      if (!isValid) {
        return { success: false, message: "Invalid email or password" };
      }

      return {
        success: true,
        user: { id: user.id, name: user.name }, // <--- return both id and name
        message: "Login successful",
      };
    }),

});

