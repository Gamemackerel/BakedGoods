# BakedGoods aka Breaducator

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). And powered by PostgreSQL through Prisma.

## Local Development

Run the development server with:

`docker-compose up`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The page auto-updates as you edit the file.

## Migrations

Generating and running migrations can be done with the following command after schema changes to schema.prisma

docker compose exec frontend npx prisma migrate dev --name init

To apply generated to the remote DB:
DATABASE_URL="mydbconnectionstring.aivencloud.com" npx prisma migrate deploy

## Deploy on Vercel

This is ready to deploy on vercel for free using the github project, as long as you have a postgres database available! (aivencloud.com has free ones). Currently the project is deployed at [https://breaducator.vercel.app/](https://breaducator.vercel.app/) using vercel and aiven DB, and can serve as a template for creating similar simple nextjs apps.  

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## TODO
* Add "skip" button
* Add keyboard shortcuts
* Refactor the project such that arbitrary comparison survey pages can be forked out easily
    * Other comparison sites could include soup-sandwhich-salad, who would win sports, any other survey 
* Consider multiple types of entities, which inform what is offered for comparisons (supers will never be matched with other supers, etc)
* Make fetchStats in comparison optional, by providing a button to expand stats if desired. This speeds up things considerably by allowing the user to click through and make submissions without waiting on any api requests. Especially useful given the free slow database being used.
  * (Will need to remove comparisons from the local cache as they are answered to prevent duplicates since we won't be reading what we are writing in that case)
