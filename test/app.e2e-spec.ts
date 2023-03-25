import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { EditUserDto } from '../src/user/dto';

import * as pactum from "pactum";
import { EditBookmarkDto, CreateBookmarkDto } from 'src/bookmark/dto';

describe("App e2e", () => {

  let app: INestApplication;
  let prisma: PrismaService
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports:[AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    }));

    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    // set base URL
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(()=> {
    if(app) app.close();
  });

  describe('Auth', () => {
    const authDto = {
      email: 'test@example.com',
      password: '123',
    }

    describe("Signup", ()=> {
      it('Should throw if email empty', () => {
        return pactum.spec().post('/auth/signup')
          .withBody({ password: authDto.password })
          .expectStatus(400);
      });

      it('Should throw if password empty', () => {
        return pactum.spec().post('/auth/signup')
          .withBody({
            email: authDto.email,
          }).expectStatus(400);
      });

      it('Should throw if no body', () => {
        return pactum.spec().post('/auth/signup')
          .expectStatus(400);
      });

      it('Should signup', () => { 
        return pactum.spec().post('/auth/signup')
          .withBody(authDto)
          .expectStatus(201);
      });

      it('Should throw if same user signup', () => { 
        return pactum.spec().post('/auth/signup')
          .withBody(authDto)
          .expectStatus(403);
      });

    });

    describe("Signin", ()=> {

      it('Should throw if email empty', () => {
        return pactum.spec().post('/auth/signin')
          .withBody({ password: authDto.password })
          .expectStatus(400);
      });

      it('Should throw if password empty', () => {
        return pactum.spec().post('/auth/signin')
          .withBody({
            email: authDto.email,
          }).expectStatus(400);
      });

      it('Should throw if no body', () => {
        return pactum.spec().post('/auth/signin')
          .expectStatus(400);
      });

      it('Should throw if wrong password', () => {
        return pactum.spec().post('/auth/signin')
        .withBody({
          email: authDto.email,
          password: '111',
        }).expectStatus(403);
      });

      it('Should signin', () => {
        return pactum.spec().post('/auth/signin')
          .withBody(authDto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });

  });

  describe('Users', () => {

    describe("Get me", ()=> {

      it('Should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });

    });

    describe("Edit user", ()=> {

      it('Should edit user', () => {

        const dto: EditUserDto = {
          firstName: 'Test',
          email: 'test@xyz.org',
        }

        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectBodyContains(dto.email)
          .expectBodyContains(dto.firstName)
          .expectStatus(200);
      });

    });

  });

  describe('Bookmarks', () => {

    describe("Get empty bookmarks", ()=> {

      it('Should return empty list', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
      
    });

    describe("Create a bookmark", ()=> {
      const dto: CreateBookmarkDto = {
        link: "Bookmark link",
        title: "Bookmark title",
        description: "Bookmark description"
      }

      it('Should create new bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });

    });

    describe("Get bookmarks", ()=> {

      it('Should return bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)          
          .expectJsonLength(1);
      });

    });

    describe("Get bookmarks by id", ()=> {
      
      it('Should return bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })          
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });

    });

    describe("Edit bookmark by id", ()=> {

      const dto: EditBookmarkDto = {
        title: "new Bookmark title",
        description: "new Bookmark description"
      }

      it('Should edit a bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });

      it ('Should throw if bookmark not owned by user', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .expectStatus(401);
      })

    });

    describe("delete bookmark by id", ()=> {
      
      it('Should delete a bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(204);
      });

      it('Should return empty list', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectJsonLength(0);
      });

    });

  });
});