// const entries = Object.entries(Kunta);

// async function getTherapists(parser: KelaParser, kunta: Kunta) {
//   const therapists = await parser.getTherapistsWithParams(
//     Lakiperuste.KUNTOUTUSPSYKOTERAPIA,
//     kunta,
//     Kuntoutusmuoto.AIKUISTEN,
//     Kieli.SUOMI
//   );
//   return therapists;
// }

// async function parse(parser: KelaParser, kunta: Kunta) {
//   let therapists = await getTherapists(parser, kunta);
//   let counter = 0;
//   for (let i = 0; i < therapists.length; i++) {
//     try {
//       const nameCheck = await prisma.therapist.findUnique({
//         where: {
//           name: therapists[i].name,
//         },
//       });
//       if (nameCheck) continue;

//       if (counter % 10 === 0 && counter !== 0) {
//         therapists = await getTherapists(parser, kunta);
//       }
//       const therapist = await parser.getTherapistInfo(i);
//       const newTherapist = {
//         name: therapist.name,
//         email: therapist.email,
//         homepage: therapist.homepage,
//         locations: {
//           connectOrCreate: therapist.locations.map((location) => {
//             return {
//               where: {
//                 name: location,
//               },
//               create: {
//                 name: location,
//               },
//             };
//           }),
//         },
//         phoneNumbers: {
//           create: therapist.phoneNumbers.map((number) => {
//             return {
//               number: number,
//             };
//           }),
//         },
//         languages: {
//           connectOrCreate: therapist.languages.map((language) => {
//             return {
//               where: {
//                 fiFI: language,
//               },
//               create: {
//                 fiFI: language,
//               },
//             };
//           }),
//         },
//         orientations: {
//           connectOrCreate: therapist.orientations.map((orientation) => {
//             return {
//               where: {
//                 fiFI: orientation,
//               },
//               create: {
//                 fiFI: orientation,
//               },
//             };
//           }),
//         },
//         therapies: {
//           create: therapist.therapyTypes.map((kuntoutus) => {
//             return {
//               muoto: kuntoutus.muoto,
//               lajit: kuntoutus.lajit,
//             };
//           }),
//         },
//       };
//       await prisma.therapist.create({
//         data: newTherapist,
//       });
//       counter++;
//       console.log(therapist);
//     } catch (error) {
//       counter++;
//       console.error(error);
//     }
//   }
// }

// async function iterate() {
//   for (const [key, value] of entries) {
//     const parser = new KelaParser();
//     console.log(`${key}: ${value}`);
//     await parse(parser, value);
//   }
// }

// iterate();