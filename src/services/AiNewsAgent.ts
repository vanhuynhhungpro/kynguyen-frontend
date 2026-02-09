import { functions } from "../firebase";
import { httpsCallable } from "firebase/functions";

// Định nghĩa Interface cho kết quả bài viết
export interface GeneratedArticle {
    title: string;
    slug: string;
    excerpt: string;
    content_html: string;
    seo_title: string;
    meta_description: string;
    primary_keyword: string;
    secondary_keywords: string[];
    suggested_category: string;
    suggested_tags: string[];
}

export const AiNewsAgent = {
    /**
     * Hàm chính để sinh nội dung bài viết.
     * Hỗ trợ Function Calling để tự động tra cứu xu hướng.
     */
    generateNewsContent: async (
        userBrief: string,
        goal: string,
        availableCategories: string[],
        availableTags: string[],
        agentType: 'default' | 'spiritual' = 'default'
    ): Promise<GeneratedArticle> => {
        const generateNewsContentFn = httpsCallable(functions, 'generateNewsContent');

        const result = await generateNewsContentFn({
            userBrief,
            goal,
            availableCategories,
            availableTags,
            agentType
        });

        return result.data as GeneratedArticle;
    },

    generateImagePrompt: async (title: string, excerpt: string, content: string): Promise<string> => {
        const fn = httpsCallable(functions, 'generateImagePrompt');
        const result = await fn({ title, excerpt, content });
        return (result.data as any).prompt;
    },

    generateImage: async (prompt: string): Promise<string> => {
        const fn = httpsCallable(functions, 'generateImage');
        const result = await fn({ prompt });
        return (result.data as any).imageBase64;
    }
};
