/* The functions here take a matrix that has already been mapped and validated and shown to the user, and do the actual import.
 */

import { FieldDefinition } from "../../model/field/FieldDefinition";
import * as mobx from "mobx";
import { Field } from "../../model/field/Field";
import { Project } from "../../model/Project/Project";
import moment from "moment";
import { Contribution } from "../../model/file/File";
const XmlNameValidator = require("xml-name-validator");
import { MappedMatrix, RowImportStatus, MappedRow } from "./MappedMatrix";
import { IImportMapping } from "./SpreadsheetToMatrix";
import { Folder, IFolderType } from "../../model/Folder/Folder";
import { NotifyException } from "../Notify";

export const availableSpreadsheetMappings = {
  LingMetaXMap: require("./LingMetaXMap.json5") as IImportMapping,
};

export async function asyncAddImportMatrixToProject(
  project: Project,
  matrix: MappedMatrix,
  folderType: IFolderType
) {
  try {
    const folders = project.getFolderArrayFromType(folderType);
    folders.unMarkAll(); // new ones will be marked
    //NO runInAction until we figure this out:
    // for some reason things will get saved as empty objects, e.g. the file will have "<Person></Person>"
    //mobx.runInAction(() =>
    const rows = matrix.rows.filter(
      (row) => row.importStatus === RowImportStatus.Yes
    );
    for (const row of rows) {
      await asyncAddFolderToProject(project, row, folderType);
    }
    //);
    folders.selectFirstMarkedFolder();
  } catch (err) {
    NotifyException(err, "There was a problem importing the project");
  }
}

// export function addPersonToProject(project: Project, row: MappedRow): Person {
//   const person = project.makeFolderForImport("person") as Person;
//   //const person = project.getOrCreatePerson(cell.value);
//   person.marked = true; // help user find the newly imported person

//   row.cells
//     .filter((cell) => cell.column.doImport && cell.value)
//     .forEach((cell, cellIndex) => {
//       const lametaKey = cell.column.lametaProperty;
//       switch (lametaKey) {
//         case "custom":
//           person.properties.addCustomProperty(
//             makeCustomField(cell.column.incomingLabel, cell.value)
//           );

//           break;
//         default:
//           person.properties.setText(lametaKey /* ? */, cell.value);
//       }
//     });

//   // if we got this far and we are replacing an existing person, move it to the bin
//   const name = row.cells.find((c) => c.column.lametaProperty === "name")?.value;
//   if (!name) throw new Error("Missing Name on cell: " + JSON.stringify(row));
//   const existingMatchingPerson = project.persons.items.find((p) =>
//     p.importIdMatchesThisFolder(name)
//   );
//   if (existingMatchingPerson) {
//     project.deleteFolder(existingMatchingPerson);
//   }
//   // change the file name from "New Person" or whatever to the actual id
//   person.nameMightHaveChanged();
//   project.finishFolderImport(person);
//   person.saveAllFilesInFolder();
//   return person;
// }

export async function asyncAddFolderToProject(
  project: Project,
  row: MappedRow,
  folderType: IFolderType
): Promise<Folder> {
  const folder = project.makeFolderForImport(folderType);
  folder.marked = true; // help user find the newly imported session

  row.cells
    .filter((cell) => cell.column.doImport && cell.value)
    .forEach((cell, cellIndex) => {
      const lametaKey = cell.column.lametaProperty;
      switch (lametaKey) {
        case "custom":
          folder.properties.addCustomProperty(
            makeCustomField(cell.column.incomingLabel, cell.value)
          );

          break;

        /* --- Session keys that require special handling --- */
        case "contribution.role":
          break;
        case "contribution.date":
          break;
        case "contribution.comments":
          break;
        case "contribution.name":
          const person = project.getOrCreatePerson(cell.value);
          person.marked = true;
          folder.metadataFile!.contributions.push(
            new Contribution(
              person.getIdToUseForReferences(),
              lookAheadForValue(row, cellIndex, "contribution.role") ??
                "participant",
              lookAheadForValue(row, cellIndex, "contribution.comments") ?? ""
            )
          );
          // TODO: have to group up to 3 consecutive cells into a single contribution record
          break;
        case "date":
          // creating "Date" to get around the deprecation warning we get if we run into, .e.g. "7/27/2022"
          const dateString: string = moment(new Date(cell.value)).format(
            "YYYY-MM-DD"
          );
          const dateField = folder.properties.getValueOrThrow("date");
          dateField.setValueFromString(dateString);
          break;
        default:
          //review: which of these 3 is correct? setText() was fine until
          // I tried to use the deprecated "fathersLanguage"
          folder.metadataFile!.addTextProperty(lametaKey, cell.value);
        //folder.properties.addTextProperty(lametaKey, cell.value);
        //folder.properties.setText(lametaKey /* ? */, cell.value);
      }
    });

  // if we got this far and we are replacing an existing session or person, move it to the bin

  //  console.log(folder.propertyForCheckingId);
  const id = row.cells.find(
    (c) => c.column.lametaProperty === folder.propertyForCheckingId
  )?.value;
  if (!id)
    throw new Error(
      `Missing ${folder.propertyForCheckingId} on cell: ${JSON.stringify(row)}`
    );
  // console.log(
  //   folder.properties.getTextStringOrEmpty(folder.propertyForCheckingId)
  // );
  const previousFolderWithThisId = project.findFolderById(folderType, id);
  //console.log(previousFolderWithThisId?.displayName);

  if (previousFolderWithThisId) {
    await project.deleteFolder(previousFolderWithThisId);
    //console.log(previousFolderWithThisId?.displayName);
  }
  // change the file name from "NewSession" or whatever to the actual id
  folder.nameMightHaveChanged();
  project.finishFolderImport(folder);
  folder.saveAllFilesInFolder();
  return folder;
}

export function makeCustomField(key: string, value: string): Field {
  let safeKey = key
    .replace(/[<>&'"\s:!\\]/g, "-")
    .trim()

    .replace(/[-]+/g, "-");
  // the above is not comprehensive, so let's make sure
  if (!XmlNameValidator.name(safeKey).success) {
    throw Error(
      `Lameta cannot handle some character in this custom column name: "${key}"`
    );
  }
  const definition: FieldDefinition = {
    key: safeKey,
    englishLabel: safeKey, // you would expect that this doesn't have to be safe, but it is actually what is used for the xml entity
    persist: true,
    type: "Text",
    tabIndex: 0,
    isCustom: true,
    showOnAutoForm: false, // we do show it, but in the custom table
  };
  const customField = Field.fromFieldDefinition(definition);
  customField.setValueFromString(value);
  return customField;
}

function lookAheadForValue(
  row: MappedRow,
  lookToRightOfCellIndex: number,
  key: string
): string | undefined {
  lookToRightOfCellIndex++;
  for (var i = lookToRightOfCellIndex; i < row.cells.length; i++) {
    if (row.cells[i].column.lametaProperty == key) return row.cells[i].value;
  }
  return undefined;
}
