const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const makeArticlesArray = require("./articles.fixtures");
const app = require("../src/app");
const makeUsersArray = require("./users.fixtures");

describe("Articles Endpoints", () => {
  let db = {};
  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });

  before("clean the table", () =>
    db.raw(
      "TRUNCATE blogful_articles, blogful_users, blogful_comments RESTART IDENTITY CASCADE"
    )
  );
  afterEach("cleanup", () =>
    db.raw(
      "TRUNCATE blogful_articles, blogful_users, blogful_comments RESTART IDENTITY CASCADE"
    )
  );
  after("disconnect from db", () => {
    db.destroy();
  });

  describe("GET /api/articles", () => {
    context("Given there are articles in the database", () => {
      const testArticles = makeArticlesArray();
      const testUsers = makeUsersArray();

      beforeEach("insert articles", () => {
        return db
          .into("blogful_users")
          .insert(testUsers)
          .then(() => db.into("blogful_articles").insert(testArticles));
      });
      afterEach("cleanup", () =>
        db.raw(
          "TRUNCATE blogful_articles, blogful_users, blogful_comments RESTART IDENTITY CASCADE"
        )
      );

      it(`responds with 200 and all of the articles`, () => {
        return supertest(app).get("/api/articles").expect(200, testArticles);
      });
    });
    context("Given the database is empty", () => {
      it(`returns with 200 and an empty array `, () => {
        return supertest(app).get("/api/articles").expect(200, []);
      });
    });
  });
  describe(`GET /api/articles/:articleId endpoint`, () => {
    context("database contains articles", () => {
      const testArticles = makeArticlesArray();
      const testUsers = makeUsersArray();
      beforeEach("insert articles", () => {
        return db
          .into("blogful_users")
          .insert(testUsers)
          .then(() => db.into("blogful_articles").insert(testArticles));
      });
      afterEach("cleanup", () =>
        db.raw(
          "TRUNCATE blogful_articles, blogful_users, blogful_comments RESTART IDENTITY CASCADE"
        )
      );


      it(`responds with 200 and the article with given ID`, () => {
        const id = 2;
        const expectedArticle = testArticles.find(
          (article) => article.id == id
        );
        return supertest(app)
          .get(`/api/articles/${id}`)
          .expect(200, expectedArticle);
      });
    });

    context("Given an XSS attack article", () => {
      const maliciousArticle = {
        id: 911,
        title: `Naughty naughty very naughty <script>alert('xss');</script>`,
        style: "How-to",
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
      };
      beforeEach("insert malicious article", () => {
        return db.into("blogful_articles").insert([maliciousArticle]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/articles/${maliciousArticle.id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.title).to.eql(
              `Naughty naughty very naughty &lt;script&gt;alert('xss');&lt;/script&gt;`
            );
            expect(res.body.content).to.eql(
              `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
            );
          });
      });
    });

    context("database is empty", () => {
      it(`responds with 404`, () => {
        const id = 1;
        return supertest(app).get(`/api/articles/${id}`).expect(404);
      });
    });
  });
  describe(`POST /api/articles`, () => {
    it(`creates an article, responding with 201 and the new article`, function () {
      this.retries(3);
      const newArticle = {
        title: "Test new article",
        style: "Listicle",
        content: "Test new article content...",
      };
      return supertest(app)
        .post("/api/articles")
        .send(newArticle)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newArticle.title);
          expect(res.body.style).to.eql(newArticle.style);
          expect(res.body.content).to.eql(newArticle.content);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/articles/${res.body.id}`);
          const expectedTime = new Date().toLocaleString();
          const actualTime = new Date(res.body.date_published).toLocaleString();
          expect(expectedTime).to.eql(actualTime);
        })
        .then((postRes) => {
          return supertest(app)
            .get(`/api/articles/${postRes.body.id}`)
            .expect(postRes.body);
        });
    });

    const requiredFields = ["title", "style", "content"];
    requiredFields.forEach((field) => {
      const newArticle = {
        title: "Test new article",
        style: "Listicle",
        content: "Test new article content...",
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newArticle[field];

        return supertest(app)
          .post("/api/articles")
          .send(newArticle)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });
  });
});
