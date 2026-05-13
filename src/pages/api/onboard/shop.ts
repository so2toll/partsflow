/**
 * Shop Owner Onboarding API Endpoint
 *
 * Creates a new Organization (type='shop') and User account, links them together,
 * and marks the invite as used.
 *
 * POST /api/onboard/shop
 * Body: {
 *   token: string,
 *   shop: { name, address, phone, email },
 *   user: { name, email, password }
 * }
 */

import type { APIRoute } from "astro";
import { ulid } from "ulid";
import { auth } from "../../../lib/auth/auth";
import { graph } from "../../../lib/db/graph";
import { inviteRepository } from "../../../lib/db/repositories/InviteRepository";
import { organizationRepository } from "../../../lib/db/repositories/OrganizationRepository";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token, shop, user } = await request.json();

    // Validate required fields
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!shop?.name || !shop?.address || !shop?.phone || !shop?.email) {
      return new Response(
        JSON.stringify({ error: "All shop fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!user?.name || !user?.email || !user?.password) {
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

    if (invite.type !== "shop_owner") {
      return new Response(
        JSON.stringify({ error: "This invite is not for shop owners" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[Onboard] Creating shop owner account for ${user.email}`);

    // Create user account via Better Auth API
    const globalUserId = `user_${ulid()}`;

    // Use Better Auth's signUp method which handles user + account creation properly
    const ctx = await auth.$context;
    const now = new Date();

    // First, create the organization
    const organization = await organizationRepository.create({
      name: shop.name,
      orgType: 'shop',
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
    });

    console.log(`[Onboard] Created organization (shop) ${organization.id}`);

    // Create user using Better Auth's API with organizationId
    const authUser = await ctx.adapter.create({
      model: "user",
      data: {
        email: user.email,
        name: user.name,
        emailVerified: true,
        role: "User",
        global_id: globalUserId,
        organizationId: organization.id, // Set organizationId directly on creation
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

    // Create User node in graph (matching auth user)
    await graph.mutate(
      `
      CREATE (u:User {
        id: $id,
        authId: $authId,
        name: $name,
        email: $email,
        role: $role,
        workerType: $workerType,
        organizationId: $organizationId,
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
        role: "ShopOwner", // Shop owner classification in app.db
        workerType: "ShopOwner", // Additional worker type for consistency
        organizationId: organization.id,
        now: now.toISOString(),
      }
    );

    // Create OWNS relationship between User and Organization
    await graph.createRelationship(globalUserId, organization.id, "OWNS", {
      role: "Owner",
      joinedAt: now.toISOString(),
    });

    console.log(`[Onboard] Created OWNS relationship: ${globalUserId} -> ${organization.id}`);

    // Mark invite as used
    await inviteRepository.markUsed(token, globalUserId);

    console.log(`[Onboard] Shop owner onboarding complete for ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        userId: globalUserId,
        organizationId: organization.id,
        message: "Account created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Onboard] Error creating shop owner account:", error);

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
