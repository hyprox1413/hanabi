FROM oven/bun:1.0.5-alpine
WORKDIR /app

EXPOSE 3000
EXPOSE 4000

RUN mkdir backend
COPY backend/package.json ./backend/
COPY backend/bun.lock ./backend/
RUN cd backend; bun i; cd ..

COPY ./util/ ./util/
COPY backend/index.ts ./backend/

RUN bun build ./backend/index.ts --compile --outfile ./binary

CMD ["./binary"]