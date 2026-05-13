/**
 * Driver Onboarding API Endpoint
 *
 * Creates a new Driver and User account, and marks the invite as used.
 *
 * POST /api/onboard/driver
 * Body: {
 *   token: string,
 *   vehicle: { make, model, year, color, plate },
 *   user: { name, email, password, phone, licenseNumber }
 * }
 */

import type { APIRoute } from "astro";
import { ulid } from "ulid";
import { auth } from "../../../lib/auth/auth";
import { graph } from "../../../lib/db/graph";
import { inviteRepository } from "../../../lib/db/repositories/InviteRepository";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token, vehicle, user } = await request.json();

    // Validate required fields
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!vehicle?.make || !vehicle?.model || !vehicle?.year || !vehicle?.color || !vehicle?.plate) {
      return new Response(
        JSON.stringify({ error: "All vehicle fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!user?.name || !user?.email || !user?.password || !user?.phone || !user?.licenseNumber) {
      return new Response(
        JSON.stringify({ error: "All user fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate invite token
    const invite = await inviteRepository.validateToken(token);

    if (!invite) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invite link" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (invite.type !== "driver") {
      return new Response(
        JSON.stringify({ error: "This invite is not for drivers" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[Onboard] Creating driver account for ${user.email}`);

    // Create user account via Better Auth API
    const ctx = await auth.$context;
    const globalUserId = `user_${ulid()}`;
    const driverId = `drv_${ulid()}`;
    const now = new Date();

    // Create auth user with role "User" (clean auth.db)
    // Driver-specific data lives in app.db
    const authUser = await ctx.adapter.create({
      model: "user",
      data: {
        email: user.email,
        name: user.name,
        emailVerified: true,
        role: "User", // All non-superadmin users are "User" in auth.db
        global_id: globalUserId,
        createdAt: now,
        updatedAt: now,
      },
    });

    const authUserId = authUser.id;

    // Hash password and create account
    const hashedPassword = await ctx.password.hash(user.password);
    await ctx.adapter.create({
      model: "account",
      data: {
        accountId: authUserId,
        providerId: "credential",
        password: hashedPassword,
        userId: authUserId,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log(`[Onboard] Created auth user ${authUserId} with global_id ${globalUserId}`);

    // Create User node in graph (all people are User nodes in app.db)
    // Driver-specific info is in both role and workerType properties, plus separate Driver node
    await graph.mutate(
      `
      CREATE (u:User {
        id: $id,
        authId: $authId,
        name: $name,
        email: $email,
        phone: $phone,
        role: $role,
        workerType: $workerType,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN u
      `,
      {
        id: globalUserId,
        authId: authUserId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: "Driver", // Worker classification in app.db
        workerType: "Driver", // Additional worker type for clarity
        now: now.toISOString(),
      }
    );

    // Create Driver node with vehicle info denormalized
    await graph.mutate(
      `
      CREATE (d:Driver {
        id: $id,
        userId: $userId,
        licenseNumber: $licenseNumber,
        vehicleMake: $vehicleMake,
        vehicleModel: $vehicleModel,
        vehicleYear: $vehicleYear,
        vehicleColor: $vehicleColor,
        vehiclePlate: $vehiclePlate,
        status: $status,
        currentLat: $currentLat,
        currentLng: $currentLng,
        createdAt: $now,
        updatedAt: $now
      })
      RETURN d
      `,
      {
        id: driverId,
        userId: globalUserId,
        licenseNumber: user.licenseNumber,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        vehicleYear: parseInt(vehicle.year),
        vehicleColor: vehicle.color,
        vehiclePlate: vehicle.plate,
        status: "offline",
        currentLat: null,
        currentLng: null,
        now: now.toISOString(),
      }
    );

    console.log(`[Onboard] Created driver ${driverId}`);

    // Create IS_DRIVER relationship between User and Driver
    await graph.createRelationship(globalUserId, driverId, "IS_DRIVER", {
      createdAt: now.toISOString(),
    });

    console.log(`[Onboard] Created IS_DRIVER relationship: ${globalUserId} -> ${driverId}`);

    // Mark invite as used
    await inviteRepository.markUsed(token, globalUserId);

    console.log(`[Onboard] Driver onboarding complete for ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        userId: globalUserId,
        driverId: driverId,
        message: "Account created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Onboard] Error creating driver account:", error);

    // Check for duplicate email error
    if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
      return new Response(
        JSON.stringify({
          error: "An account with this email already exists",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to create account",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
