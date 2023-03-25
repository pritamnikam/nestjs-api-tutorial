import { Injectable } from '@nestjs/common';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from "../prisma/prisma.service";
import { ForbiddenException } from '@nestjs/common/exceptions';

@Injectable()
export class BookmarkService {

    constructor(private prisma: PrismaService) {  }

    async createBookmark(userId: number, dto: CreateBookmarkDto) {
        const bookmark = await this.prisma.bookmark.create({
            data: {
                userId,
                ...dto,
            }
        });

        return bookmark;
    }

    async getBookmarks(userId: number) {
        const bookmarks = await this.prisma.bookmark.findMany({
            where: {
                userId
            }
        });

        return bookmarks;
    }

    async getBookmarkById(userId: number, bookmarkId: number) {
        const bookmark = await this.prisma.bookmark.findFirst({
            where: {
                id: bookmarkId,
                userId
            }
        });

        return bookmark;
    }

    async editBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto) {
        // 1. get the bookmark by id
        // throw if bookmark not found or user does not own the bookmark
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                id: bookmarkId
            }
        });

        if(!bookmark || bookmark.userId !== userId) {
            throw new ForbiddenException('Access to resource denied.');
        }

        return await this.prisma.bookmark.update({
            where: {
                id: bookmarkId,
            },
            data: {
                ...dto,
            }
        });
    }
    
    async deleteBookmarkById(userId: number, bookmarkId: number) {
        // 1. get the bookmark by id
        // throw if bookmark not found or user does not own the bookmark
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                id: bookmarkId
            }
        });

        if(!bookmark || bookmark.userId !== userId) {
            throw new ForbiddenException('Access to resource denied.');
        }
        
        await this.prisma.bookmark.delete({
            where: {
                id: bookmarkId
            }
        });
    }
}
