import { adminAuth, adminDb, FieldValue } from "@/lib/firebase/server";
import { ROLES, Role, isValidRole } from "./roles";

/**
 * Get all users with their roles
 */
export async function getAllUsers() {
  try {
    const usersSnapshot = await adminDb.collection("users").get();
    
    const users = await Promise.all(
      usersSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        try {
          const authUser = await adminAuth.getUser(doc.id);
          
          return {
            uid: doc.id,
            email: authUser.email,
            displayName: authUser.displayName || data.displayName || "",
            role: data.role || ROLES.USER,
            blocked: data.blocked || false,
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            photoURL: authUser.photoURL || null,
          };
        } catch (error) {
          console.error(`Error fetching auth user ${doc.id}:`, error);
          return null;
        }
      })
    );
    
    return {
      ok: true,
      users: users.filter(u => u !== null),
    };
  } catch (error: any) {
    console.error("Get all users error:", error);
    return {
      ok: false,
      message: error.message || "Failed to fetch users",
    };
  }
}

/**
 * Update user role (ADMIN only)
 */
export async function updateUserRole(userId: string, newRole: Role, performedBy: string) {
  try {
    console.log('🔧 updateUserRole called:', { userId, newRole, performedBy });
    
    if (!isValidRole(newRole)) {
      console.error('❌ Invalid role:', newRole);
      return {
        ok: false,
        message: `Invalid role: ${newRole}`,
      };
    }

    // Update custom claims in Firebase Auth
    console.log('📝 Setting custom claims for user:', userId, 'role:', newRole);
    await adminAuth.setCustomUserClaims(userId, { role: newRole });
    console.log('✅ Custom claims updated successfully');

    // Update Firestore document
    console.log('📝 Updating Firestore document for user:', userId);
    await adminDb.collection("users").doc(userId).set(
      {
        role: newRole,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log('✅ Firestore updated successfully');

    // Log action
    console.log('📝 Logging role update action');
    await adminDb.collection("system_logs").add({
      action: "ROLE_UPDATED",
      targetUserId: userId,
      newRole,
      performedBy,
      timestamp: FieldValue.serverTimestamp(),
    });
    console.log('✅ Action logged successfully');

    console.log('✅ Role update completed successfully for user:', userId);
    return {
      ok: true,
      message: "Role updated successfully. User must logout and login again to see changes.",
    };
  } catch (error: any) {
    console.error("❌ Update role error:", error);
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      ok: false,
      message: error.message || "Failed to update role",
    };
  }
}

/**
 * Block user
 */
export async function blockUser(userId: string, reason: string, performedBy: string) {
  try {
    // Disable user in Firebase Auth
    await adminAuth.updateUser(userId, { disabled: true });

    // Update Firestore
    await adminDb.collection("users").doc(userId).set(
      {
        blocked: true,
        blockReason: reason,
        blockedAt: FieldValue.serverTimestamp(),
        blockedBy: performedBy,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Log action
    await adminDb.collection("system_logs").add({
      action: "USER_BLOCKED",
      targetUserId: userId,
      reason,
      performedBy,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ok: true,
      message: "User blocked successfully",
    };
  } catch (error: any) {
    console.error("Block user error:", error);
    return {
      ok: false,
      message: error.message || "Failed to block user",
    };
  }
}

/**
 * Unblock user
 */
export async function unblockUser(userId: string, performedBy: string) {
  try {
    // Enable user in Firebase Auth
    await adminAuth.updateUser(userId, { disabled: false });

    // Update Firestore
    await adminDb.collection("users").doc(userId).set(
      {
        blocked: false,
        blockReason: null,
        unblockedAt: FieldValue.serverTimestamp(),
        unblockedBy: performedBy,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Log action
    await adminDb.collection("system_logs").add({
      action: "USER_UNBLOCKED",
      targetUserId: userId,
      performedBy,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ok: true,
      message: "User unblocked successfully",
    };
  } catch (error: any) {
    console.error("Unblock user error:", error);
    return {
      ok: false,
      message: error.message || "Failed to unblock user",
    };
  }
}

/**
 * Delete user (ADMIN only)
 */
export async function deleteUser(userId: string, performedBy: string) {
  try {
    // Delete from Firebase Auth
    await adminAuth.deleteUser(userId);

    // Delete from Firestore
    await adminDb.collection("users").doc(userId).delete();

    // Log action
    await adminDb.collection("system_logs").add({
      action: "USER_DELETED",
      targetUserId: userId,
      performedBy,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ok: true,
      message: "User deleted successfully",
    };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return {
      ok: false,
      message: error.message || "Failed to delete user",
    };
  }
}

/**
 * Promote user: USER -> ADMINISTRATOR
 */
export async function promoteToAdministrator(userId: string, performedBy: string) {
  return updateUserRole(userId, ROLES.ADMINISTRATOR, performedBy);
}

/**
 * Demote user: ADMINISTRATOR -> USER
 */
export async function demoteToUser(userId: string, performedBy: string) {
  return updateUserRole(userId, ROLES.USER, performedBy);
}

/**
 * Make user ADMIN (root only)
 */
export async function makeAdmin(userId: string, performedBy: string) {
  return updateUserRole(userId, ROLES.ADMIN, performedBy);
}
