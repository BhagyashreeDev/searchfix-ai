/**
 * Configurable User Classification Rules for SearchFix AI (Phase 2).
 * Categorizes comment authors into INTERNAL, CLIENT, or SYSTEM roles.
 */

export const USER_CONFIG = {
    internalPatterns: [
        "_ADSSearchType",
        "Searcher",
        "QC"
    ],
    clientPatterns: [
        "RVSI-Outsource:"
    ],
    systemPatterns: [
        "OWLServiceUser",
        "AUTO_PLUser",
        "SYSTEM"
    ]
};

/**
 * Classifies a comment author into INTERNAL, CLIENT, or SYSTEM.
 * 
 * @param {string} author Comment author name
 * @returns {"INTERNAL" | "CLIENT" | "SYSTEM"} User role category
 */
export function classifyUserRole(author) {
    if (!author || typeof author !== "string") {
        return "SYSTEM";
    }

    const trimmed = author.trim();

    for (const pattern of USER_CONFIG.systemPatterns) {
        if (trimmed.includes(pattern)) return "SYSTEM";
    }

    for (const pattern of USER_CONFIG.clientPatterns) {
        if (trimmed.includes(pattern)) return "CLIENT";
    }

    for (const pattern of USER_CONFIG.internalPatterns) {
        if (trimmed.includes(pattern)) return "INTERNAL";
    }

    // Default fallback heuristics
    if (trimmed.includes("User") || trimmed.includes("AUTO")) {
        return "SYSTEM";
    }

    // If author has an underscore (e.g., GanneIS_FAI, Pjayaram_FAI), check if client or internal
    return "CLIENT";
}
