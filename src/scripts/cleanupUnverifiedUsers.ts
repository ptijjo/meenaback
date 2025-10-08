import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupUnverifiedUsers() {
  try {
    const now = new Date();
    const result = await prisma.user.deleteMany({
      where: {
        isVerified: false,
        verificationExpiresAt: { lt: now },
      },
    });

    if (result.count > 0) {
      console.log(`🧹 ${result.count} comptes non vérifiés supprimés (${now.toISOString()})`);
    } else {
      console.log(`✅ Aucun compte à supprimer (${now.toISOString()})`);
    }
  } catch (error) {
    console.error('❌ Erreur pendant le nettoyage :', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution immédiate si lancé manuellement
cleanupUnverifiedUsers();
