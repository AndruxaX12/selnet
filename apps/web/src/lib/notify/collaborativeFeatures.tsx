import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getFirestore } from "firebase/firestore";
import { PushNotificationPayload } from "./pushManager";

const db = getFirestore(app);

// Collaborative Notification Types
export interface CollaborativeSpace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  settings: CollaborativeSettings;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, any>;
}

export interface CollaborativeSettings {
  allowMemberInvites: boolean;
  allowMemberEdits: boolean;
  sharedPreferences: boolean;
  sharedAnalytics: boolean;
  notificationDelegation: boolean;
  collaborativeFiltering: boolean;
  realTimeSync: boolean;
}

export interface NotificationCollaboration {
  notificationId: string;
  spaceId: string;
  collaborators: Collaborator[];
  status: "draft" | "review" | "approved" | "published";
  comments: CollaborationComment[];
  history: CollaborationEvent[];
  permissions: CollaborationPermissions;
}

export interface Collaborator {
  userId: string;
  role: "owner" | "editor" | "reviewer" | "viewer";
  permissions: string[];
  joinedAt: number;
  lastActive: number;
  status: "active" | "inactive" | "pending";
}

export interface CollaborationComment {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  parentId?: string; // For threaded comments
  reactions: Reaction[];
  metadata: Record<string, any>;
}

export interface Reaction {
  userId: string;
  type: "like" | "dislike" | "love" | "laugh" | "angry" | "sad";
  timestamp: number;
}

export interface CollaborationEvent {
  id: string;
  userId: string;
  action: "created" | "edited" | "commented" | "approved" | "rejected" | "shared";
  timestamp: number;
  details: Record<string, any>;
  before?: any;
  after?: any;
}

export interface CollaborationPermissions {
  canEdit: string[]; // User IDs
  canComment: string[];
  canApprove: string[];
  canView: string[];
  canShare: string[];
}

export interface SharedNotificationPreferences {
  spaceId: string;
  preferences: Record<string, any>;
  overrides: Record<string, any>;
  appliedToUsers: string[];
  lastSync: number;
}

export interface CollaborativeAnalytics {
  spaceId: string;
  totalCollaborations: number;
  activeCollaborators: number;
  averageCollaborationTime: number;
  notificationApprovalRate: number;
  memberEngagement: Record<string, number>;
  collaborationTrends: CollaborationTrend[];
}

export interface CollaborationTrend {
  date: string;
  collaborations: number;
  participants: number;
  avgDuration: number;
  topContributors: string[];
}

// Real-time Collaboration Manager
export class CollaborativeNotificationManager {
  private static instance: CollaborativeNotificationManager;
  private spaces: Map<string, CollaborativeSpace> = new Map();
  private collaborations: Map<string, NotificationCollaboration> = new Map();
  private subscriptions: Map<string, () => void> = new Map();
  private readonly db = getFirestore(app);

  private constructor() {}

  static getInstance(): CollaborativeNotificationManager {
    if (!CollaborativeNotificationManager.instance) {
      CollaborativeNotificationManager.instance = new CollaborativeNotificationManager();
    }
    return CollaborativeNotificationManager.instance;
  }

  // Create a new collaborative space
  async createSpace(
    ownerId: string,
    name: string,
    description: string,
    settings: Partial<CollaborativeSettings> = {}
  ): Promise<string> {
    const spaceId = this.generateSpaceId();
    const now = Date.now();

    const space: CollaborativeSpace = {
      id: spaceId,
      name,
      description,
      ownerId,
      memberIds: [ownerId],
      settings: {
        allowMemberInvites: true,
        allowMemberEdits: true,
        sharedPreferences: false,
        sharedAnalytics: false,
        notificationDelegation: false,
        collaborativeFiltering: true,
        realTimeSync: true,
        ...settings
      },
      createdAt: now,
      updatedAt: now,
      metadata: {}
    };

    try {
      await setDoc(doc(this.db, "collaborativeSpaces", spaceId), space);
      this.spaces.set(spaceId, space);

      console.log(`Created collaborative space: ${spaceId}`);
      return spaceId;
    } catch (error) {
      console.error("Failed to create collaborative space:", error);
      throw error;
    }
  }

  // Invite user to collaborative space
  async inviteToSpace(spaceId: string, inviterId: string, inviteeId: string): Promise<boolean> {
    try {
      const space = await this.getSpace(spaceId);
      if (!space) return false;

      if (!space.settings.allowMemberInvites && space.ownerId !== inviterId) {
        throw new Error("Invites not allowed in this space");
      }

      if (space.memberIds.includes(inviteeId)) {
        return true; // Already a member
      }

      // Add invitation
      await updateDoc(doc(this.db, "collaborativeSpaces", spaceId), {
        [`invitations.${inviteeId}`]: {
          invitedBy: inviterId,
          invitedAt: Date.now(),
          status: "pending"
        },
        updatedAt: Date.now()
      });

      // Send invitation notification
      // This would be handled by the notification system

      return true;
    } catch (error) {
      console.error("Failed to invite user to space:", error);
      return false;
    }
  }

  // Accept space invitation
  async acceptInvitation(spaceId: string, userId: string): Promise<boolean> {
    try {
      const space = await this.getSpace(spaceId);
      if (!space) return false;

      // Update invitation status
      await updateDoc(doc(this.db, "collaborativeSpaces", spaceId), {
        memberIds: arrayUnion(userId),
        [`invitations.${userId}.status`]: "accepted",
        updatedAt: Date.now()
      });

      // Update local space
      space.memberIds.push(userId);
      this.spaces.set(spaceId, space);

      return true;
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      return false;
    }
  }

  // Create collaborative notification
  async createCollaborativeNotification(
    spaceId: string,
    creatorId: string,
    notification: PushNotificationPayload
  ): Promise<string> {
    try {
      const space = await this.getSpace(spaceId);
      if (!space) throw new Error("Space not found");

      if (!space.memberIds.includes(creatorId)) {
        throw new Error("User not in space");
      }

      const collaborationId = this.generateCollaborationId();
      const now = Date.now();

      const collaboration: NotificationCollaboration = {
        notificationId: collaborationId,
        spaceId,
        collaborators: [{
          userId: creatorId,
          role: "owner",
          permissions: ["edit", "comment", "approve", "share"],
          joinedAt: now,
          lastActive: now,
          status: "active"
        }],
        status: "draft",
        comments: [],
        history: [{
          id: this.generateEventId(),
          userId: creatorId,
          action: "created",
          timestamp: now,
          details: { notification: notification.title }
        }],
        permissions: {
          canEdit: space.memberIds,
          canComment: space.memberIds,
          canApprove: [space.ownerId],
          canView: space.memberIds,
          canShare: space.memberIds
        }
      };

      await setDoc(doc(this.db, "collaborativeNotifications", collaborationId), collaboration);
      this.collaborations.set(collaborationId, collaboration);

      return collaborationId;
    } catch (error) {
      console.error("Failed to create collaborative notification:", error);
      throw error;
    }
  }

  // Add comment to collaborative notification
  async addComment(
    collaborationId: string,
    userId: string,
    content: string,
    parentId?: string
  ): Promise<string> {
    try {
      const collaboration = await this.getCollaboration(collaborationId);
      if (!collaboration) throw new Error("Collaboration not found");

      const commentId = this.generateCommentId();
      const now = Date.now();

      const comment: CollaborationComment = {
        id: commentId,
        userId,
        content,
        timestamp: now,
        parentId,
        reactions: [],
        metadata: {}
      };

      await updateDoc(doc(this.db, "collaborativeNotifications", collaborationId), {
        comments: arrayUnion(comment),
        updatedAt: now
      });

      // Add to local collaboration
      collaboration.comments.push(comment);
      this.collaborations.set(collaborationId, collaboration);

      return commentId;
    } catch (error) {
      console.error("Failed to add comment:", error);
      throw error;
    }
  }

  // Add reaction to comment
  async addReaction(
    collaborationId: string,
    commentId: string,
    userId: string,
    reactionType: Reaction["type"]
  ): Promise<boolean> {
    try {
      const collaboration = await this.getCollaboration(collaborationId);
      if (!collaboration) return false;

      const comment = collaboration.comments.find(c => c.id === commentId);
      if (!comment) return false;

      // Remove existing reaction from this user
      comment.reactions = comment.reactions.filter(r => r.userId !== userId);

      // Add new reaction
      comment.reactions.push({
        userId,
        type: reactionType,
        timestamp: Date.now()
      });

      await updateDoc(doc(this.db, "collaborativeNotifications", collaborationId), {
        comments: collaboration.comments,
        updatedAt: Date.now()
      });

      return true;
    } catch (error) {
      console.error("Failed to add reaction:", error);
      return false;
    }
  }

  // Approve collaborative notification
  async approveNotification(
    collaborationId: string,
    userId: string,
    approved: boolean
  ): Promise<boolean> {
    try {
      const collaboration = await this.getCollaboration(collaborationId);
      if (!collaboration) return false;

      const userRole = collaboration.collaborators.find(c => c.userId === userId)?.role;
      if (userRole !== "owner" && !collaboration.permissions.canApprove.includes(userId)) {
        throw new Error("User does not have approval permissions");
      }

      const newStatus = approved ? "approved" : "review";
      const now = Date.now();

      await updateDoc(doc(this.db, "collaborativeNotifications", collaborationId), {
        status: newStatus,
        updatedAt: now
      });

      // Add to history
      collaboration.history.push({
        id: this.generateEventId(),
        userId,
        action: approved ? "approved" : "rejected",
        timestamp: now,
        details: { approved }
      });

      collaboration.status = newStatus;
      this.collaborations.set(collaborationId, collaboration);

      return true;
    } catch (error) {
      console.error("Failed to approve notification:", error);
      return false;
    }
  }

  // Share collaborative notification
  async shareNotification(
    collaborationId: string,
    userId: string,
    targetUserIds: string[]
  ): Promise<boolean> {
    try {
      const collaboration = await this.getCollaboration(collaborationId);
      if (!collaboration) return false;

      if (!collaboration.permissions.canShare.includes(userId)) {
        throw new Error("User does not have share permissions");
      }

      // Send notifications to target users
      // This would integrate with the main notification system

      // Add to history
      collaboration.history.push({
        id: this.generateEventId(),
        userId,
        action: "shared",
        timestamp: Date.now(),
        details: { targetUsers: targetUserIds }
      });

      await updateDoc(doc(this.db, "collaborativeNotifications", collaborationId), {
        updatedAt: Date.now()
      });

      return true;
    } catch (error) {
      console.error("Failed to share notification:", error);
      return false;
    }
  }

  // Subscribe to real-time updates
  subscribeToSpace(spaceId: string, callback: (space: CollaborativeSpace) => void): () => void {
    const unsubscribe = onSnapshot(
      doc(this.db, "collaborativeSpaces", spaceId),
      (doc) => {
        if (doc.exists()) {
          const space = doc.data() as CollaborativeSpace;
          this.spaces.set(spaceId, space);
          callback(space);
        }
      },
      (error) => {
        console.error("Error subscribing to space:", error);
      }
    );

    return unsubscribe;
  }

  // Subscribe to collaborative notification
  subscribeToCollaboration(
    collaborationId: string,
    callback: (collaboration: NotificationCollaboration) => void
  ): () => void {
    const unsubscribe = onSnapshot(
      doc(this.db, "collaborativeNotifications", collaborationId),
      (doc) => {
        if (doc.exists()) {
          const collaboration = doc.data() as NotificationCollaboration;
          this.collaborations.set(collaborationId, collaboration);
          callback(collaboration);
        }
      },
      (error) => {
        console.error("Error subscribing to collaboration:", error);
      }
    );

    return unsubscribe;
  }

  // Get space
  async getSpace(spaceId: string): Promise<CollaborativeSpace | null> {
    if (this.spaces.has(spaceId)) {
      return this.spaces.get(spaceId)!;
    }

    try {
      const spaceDoc = await getDoc(doc(this.db, "collaborativeSpaces", spaceId));
      if (spaceDoc.exists()) {
        const space = spaceDoc.data() as CollaborativeSpace;
        this.spaces.set(spaceId, space);
        return space;
      }
      return null;
    } catch (error) {
      console.error("Failed to get space:", error);
      return null;
    }
  }

  // Get collaboration
  async getCollaboration(collaborationId: string): Promise<NotificationCollaboration | null> {
    if (this.collaborations.has(collaborationId)) {
      return this.collaborations.get(collaborationId)!;
    }

    try {
      const collaborationDoc = await getDoc(doc(this.db, "collaborativeNotifications", collaborationId));
      if (collaborationDoc.exists()) {
        const collaboration = collaborationDoc.data() as NotificationCollaboration;
        this.collaborations.set(collaborationId, collaboration);
        return collaboration;
      }
      return null;
    } catch (error) {
      console.error("Failed to get collaboration:", error);
      return null;
    }
  }

  // Get user's spaces
  async getUserSpaces(userId: string): Promise<CollaborativeSpace[]> {
    try {
      // In a real implementation, this would query Firestore
      // For now, return spaces where user is a member
      const userSpaces: CollaborativeSpace[] = [];

      for (const space of this.spaces.values()) {
        if (space.memberIds.includes(userId)) {
          userSpaces.push(space);
        }
      }

      return userSpaces;
    } catch (error) {
      console.error("Failed to get user spaces:", error);
      return [];
    }
  }

  // Get user's collaborations
  async getUserCollaborations(userId: string): Promise<NotificationCollaboration[]> {
    try {
      const userCollaborations: NotificationCollaboration[] = [];

      for (const collaboration of this.collaborations.values()) {
        if (collaboration.collaborators.some(c => c.userId === userId)) {
          userCollaborations.push(collaboration);
        }
      }

      return userCollaborations;
    } catch (error) {
      console.error("Failed to get user collaborations:", error);
      return [];
    }
  }

  // Get collaborative analytics
  async getCollaborativeAnalytics(spaceId: string): Promise<CollaborativeAnalytics | null> {
    try {
      const analyticsDoc = await getDoc(doc(this.db, "collaborativeAnalytics", spaceId));
      if (analyticsDoc.exists()) {
        return analyticsDoc.data() as CollaborativeAnalytics;
      }
      return null;
    } catch (error) {
      console.error("Failed to get collaborative analytics:", error);
      return null;
    }
  }

  // Utility methods
  private generateSpaceId(): string {
    return `space-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCollaborationId(): string {
    return `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCommentId(): string {
    return `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// React hook for collaborative features
export function useCollaborativeNotifications() {
  const { user } = useAuth();
  const [manager] = useState(() => CollaborativeNotificationManager.getInstance());
  const [spaces, setSpaces] = useState<CollaborativeSpace[]>([]);
  const [collaborations, setCollaborations] = useState<NotificationCollaboration[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's spaces and collaborations
  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [userSpaces, userCollaborations] = await Promise.all([
        manager.getUserSpaces(user.uid),
        manager.getUserCollaborations(user.uid)
      ]);

      setSpaces(userSpaces);
      setCollaborations(userCollaborations);
    } catch (error) {
      console.error("Failed to load collaborative data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, manager]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createSpace = useCallback(async (
    name: string,
    description: string,
    settings?: Partial<CollaborativeSettings>
  ) => {
    if (!user) return null;

    try {
      return await manager.createSpace(user.uid, name, description, settings);
    } catch (error) {
      console.error("Failed to create space:", error);
      return null;
    }
  }, [user, manager]);

  const inviteToSpace = useCallback(async (spaceId: string, inviteeId: string) => {
    if (!user) return false;

    try {
      return await manager.inviteToSpace(spaceId, user.uid, inviteeId);
    } catch (error) {
      console.error("Failed to invite user:", error);
      return false;
    }
  }, [user, manager]);

  const acceptInvitation = useCallback(async (spaceId: string) => {
    if (!user) return false;

    try {
      return await manager.acceptInvitation(spaceId, user.uid);
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      return false;
    }
  }, [user, manager]);

  const createCollaborativeNotification = useCallback(async (
    spaceId: string,
    notification: PushNotificationPayload
  ) => {
    if (!user) return null;

    try {
      return await manager.createCollaborativeNotification(spaceId, user.uid, notification);
    } catch (error) {
      console.error("Failed to create collaborative notification:", error);
      return null;
    }
  }, [user, manager]);

  const addComment = useCallback(async (
    collaborationId: string,
    content: string,
    parentId?: string
  ) => {
    if (!user) return null;

    try {
      return await manager.addComment(collaborationId, user.uid, content, parentId);
    } catch (error) {
      console.error("Failed to add comment:", error);
      return null;
    }
  }, [user, manager]);

  const addReaction = useCallback(async (
    collaborationId: string,
    commentId: string,
    reactionType: Reaction["type"]
  ) => {
    if (!user) return false;

    try {
      return await manager.addReaction(collaborationId, commentId, user.uid, reactionType);
    } catch (error) {
      console.error("Failed to add reaction:", error);
      return false;
    }
  }, [user, manager]);

  const approveNotification = useCallback(async (
    collaborationId: string,
    approved: boolean
  ) => {
    if (!user) return false;

    try {
      return await manager.approveNotification(collaborationId, user.uid, approved);
    } catch (error) {
      console.error("Failed to approve notification:", error);
      return false;
    }
  }, [user, manager]);

  const shareNotification = useCallback(async (
    collaborationId: string,
    targetUserIds: string[]
  ) => {
    if (!user) return false;

    try {
      return await manager.shareNotification(collaborationId, user.uid, targetUserIds);
    } catch (error) {
      console.error("Failed to share notification:", error);
      return false;
    }
  }, [user, manager]);

  return {
    spaces,
    collaborations,
    loading,
    createSpace,
    inviteToSpace,
    acceptInvitation,
    createCollaborativeNotification,
    addComment,
    addReaction,
    approveNotification,
    shareNotification,
    loadData
  };
}

// Collaborative notification UI component
export function CollaborativeNotificationPanel() {
  const { user } = useAuth();
  const {
    spaces,
    collaborations,
    loading,
    createSpace,
    inviteToSpace,
    acceptInvitation,
    createCollaborativeNotification,
    addComment,
    addReaction,
    approveNotification,
    shareNotification
  } = useCollaborativeNotifications();

  const [activeTab, setActiveTab] = useState<"spaces" | "collaborations" | "activity">("spaces");
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDescription, setNewSpaceDescription] = useState("");

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) return;

    try {
      await createSpace(newSpaceName, newSpaceDescription);
      setShowCreateSpace(false);
      setNewSpaceName("");
      setNewSpaceDescription("");
    } catch (error) {
      console.error("Failed to create space:", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Зареждане...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: "spaces", name: "Пространства", icon: "🏢" },
              { id: "collaborations", name: "Сътрудничество", icon: "👥" },
              { id: "activity", name: "Активност", icon: "📊" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "spaces" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Сътруднически пространства</h3>
                <button
                  onClick={() => setShowCreateSpace(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Създай пространство
                </button>
              </div>

              {spaces.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Все още нямате сътруднически пространства</p>
                  <p className="text-sm">Създайте пространство за да започнете да сътрудничите с други потребители</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {spaces.map((space) => (
                    <div key={space.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">{space.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{space.description}</p>
                      <div className="mt-3 text-xs text-gray-500">
                        {space.memberIds.length} членове
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "collaborations" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Активни сътрудничества</h3>
              <div className="text-center py-8 text-gray-500">
                Функцията за сътрудничество ще бъде имплементирана в следващата версия
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Активност</h3>
              <div className="text-center py-8 text-gray-500">
                Аналитиката за сътрудничество ще бъде имплементирана в следващата версия
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Space Modal */}
      {showCreateSpace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Създай ново пространство</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="newSpaceName" className="block text-sm font-medium text-gray-700 mb-1">Име</label>
                <input
                  id="newSpaceName"
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Име на пространството"
                />
              </div>

              <div>
                <label htmlFor="newSpaceDescription" className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  id="newSpaceDescription"
                  value={newSpaceDescription}
                  onChange={(e) => setNewSpaceDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  placeholder="Описание на пространството"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateSpace(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Отказ
                </button>
                <button
                  onClick={handleCreateSpace}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Създай
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
