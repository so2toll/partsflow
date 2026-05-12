/**
 * Repository Index
 *
 * Exports all graph-based repositories for easy importing.
 *
 * @module lib/db/repositories
 */

// Core entity repositories
export { teamRepository, TeamRepository } from "./TeamRepository";
export type { Team, TeamMember } from "./TeamRepository";

export { projectRepository, ProjectRepository } from "./ProjectRepository";
export type {
  Project,
  ProjectSettings,
  ProjectPermissionLevel,
  ProjectPermission,
  EffectivePermission,
  VideoProject,
  ProjectMode,
  VideoProjectStatus,
} from "./ProjectRepository";

export { organizationRepository, OrganizationRepository } from "./OrganizationRepository";
export type { Organization } from "./OrganizationRepository";

export { userSubscriptionRepository } from "./UserSubscriptionRepository";
export type { UserSubscription, User } from "./UserSubscriptionRepository";

// Video AI Content Studio repositories
export { characterRepository, CharacterRepository } from "./CharacterRepository";
export type { Character, CreateCharacterData } from "./CharacterRepository";

export { sceneRepository, SceneRepository } from "./SceneRepository";
export type {
  Scene,
  SceneStatus,
  ModelSelection,
  CreateSceneData,
} from "./SceneRepository";

export { jobRepository, JobRepository } from "./JobRepository";
export type {
  Job,
  JobStatus,
  JobType,
  CreateJobData,
} from "./JobRepository";

export { assetRepository, AssetRepository } from "./AssetRepository";
export type {
  UploadedAsset,
  IndexingStatus,
  CreateAssetData,
} from "./AssetRepository";

export { clipRepository, ClipRepository } from "./ClipRepository";
export type { Clip, CreateClipData } from "./ClipRepository";

export { studioVideoRepository, StudioVideoRepository } from "./StudioVideoRepository";
export type { StudioVideo, CreateStudioVideoData } from "./StudioVideoRepository";

export { paymentRepository, PaymentRepository } from "./PaymentRepository";
export type { PaymentEvent, CreatePaymentEventData } from "./PaymentRepository";
