"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
// Helper functions
function createSuccessResponse(data) {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
}
function createErrorResponse(errorMessage) {
    return {
        content: [
            {
                type: 'text',
                text: `Error: ${errorMessage}`,
            },
        ],
        isError: true,
    };
}
//# sourceMappingURL=types.js.map