// like-response.dto.ts
export class LikeResponseDto {
    message: string;
    id: number;
    user: {
        id: number;
        username: string;
    };
    post: {
        id: number;
        content: string;
        mediaurl: string
    };
}
