export interface GuardResult {
    accepted: boolean;
    reason?: string;
    image_id?: string;
    similarity_score?: number;
}

export interface MatchCandidate {
    image_id: string;
    subject: string;
    category: string;
    caption: string;
    confidence: number;
    similarity_score: number;
}

export function evaluateMatch(
    postCategory: string,
    postTitle: string,
    candidate: MatchCandidate,
    similarityThreshold: number = 0.65
): GuardResult {
    if (postCategory !== candidate.category) {
        return {
            accepted: false,
            reason: `Category mismatch: expected "${postCategory}", got "${candidate.category}"`,
            image_id: candidate.image_id,
            similarity_score: candidate.similarity_score,
        };
    }

    const postLower = postTitle.toLowerCase();
    const subjectLower = candidate.subject.toLowerCase();
    const keywords = subjectLower.split(' ');
    
    let matchFound = false;
    for (const word of keywords) {
        if (postLower.includes(word)) {
            matchFound = true;
            break;
        }
    }

    if (!matchFound && candidate.similarity_score < similarityThreshold) {
        return {
            accepted: false,
            reason: `Subject mismatch: "${candidate.subject}" not found in post title, similarity ${candidate.similarity_score} < ${similarityThreshold}`,
            image_id: candidate.image_id,
            similarity_score: candidate.similarity_score,
        };
    }

    if (candidate.similarity_score < similarityThreshold) {
        return {
            accepted: false,
            reason: `Similarity ${candidate.similarity_score} below threshold ${similarityThreshold}`,
            image_id: candidate.image_id,
            similarity_score: candidate.similarity_score,
        };
    }

    return {
        accepted: true,
        image_id: candidate.image_id,
        similarity_score: candidate.similarity_score,
    };
}
