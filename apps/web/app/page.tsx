import { trpc } from '@web/app/trpc';

export default async function Home() {
  const { users } = await trpc.getUsers.query();

  const { greeting } = await trpc.sayHello.query({
    name: 'Bruce',
  })
  return (
    <>
      <h4>{'Greeting from backend API:'}</h4>
      <div>{greeting}</div>
      <h4>{'Users from Database:'}</h4>
      <div>{JSON.stringify(users)}</div>
      <button className="btn">daisyUI Button</button>
    </>
  );
}
