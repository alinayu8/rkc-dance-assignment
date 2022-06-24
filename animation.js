$(document).ready(function() {

    var file_data = '';

    // FILE PARSED
    document.querySelector('#csv').onchange = function(e){
       // first file selected by user
        var file = this.files[0];

        // read the file
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function(event){
          var csv = event.target.result;
          var data = $.csv.toArrays(csv);
          file_data = data;
          $("#form").show();
        }
    };

    // SLOTTING FUNCTION
    function slot(group_num_min, group_num_max, group, compare_group) {
        group_members = [];
        for (let i = group_num_min; i < group_num_max; i++) {
            member = group[i];
            dance_total = group[i][2];
            if (i != group.length - 1 && dance_total == group[i + 1][2]) { // if not last, take a peek ahead to randomize maybe...
                random_member = randomize(group, dance_total, group_members, compare_group);
                group_members.push(random_member);
            } else if (i != 0 && dance_total == group[i - 1][2]) { // if not first, take a peek behind to randomize maybe...
                random_member = randomize(group, dance_total, group_members, compare_group);
                group_members.push(random_member);
            } else { // if NOT tied, just push
                group_members.push(member);
            }
        }
        return group_members;
    }

    // RANDOMIZE FUNCTION
    function randomize(group, dance_total, existing_lineup, compare_group) {
        rand_members = [];
        for (i = 0; i < group.length; i++) { // grab and randomize the members with the same total dances
            if (dance_total == group[i][2] && existing_lineup.indexOf(group[i]) == -1 && compare_group.indexOf(group[i]) == -1) {
                rand_members.push(group[i]);
            }
        }
        // slot randomized member
        let random = rand_members[Math.floor(Math.random()*rand_members.length)];
        return random;
    }

    function validate_csv() {
        // validate csv
        groupAnum = 0;
        // Are there headers?
        if (/^[0-9]+$/.test(file_data[0][2])) {
            $("#error").html("Please include headers in your CSV.")
            return false;
        }

        for (let i = 1; i < file_data.length; i++) {
            name = file_data[i][0];
            group = file_data[i][1];
            num_dances = file_data[i][2];

            // Make sure our groups names are valid
            if (!/^[A-Ca-c]{1}$/.test(group)) {
                $("#error").html("Make sure the CSV has valid group names (A, B, C) in the 2nd column.")
                return false;
            } else {
                file_data[i][1] = file_data[i][1].toUpperCase(); // change to uppercase
                if (file_data[i][1] == "A") {
                    groupAnum += 1;
                }
            }

            // Make sure our numbers are valid
            if (!/^[0-9]+$/.test(num_dances)) {
                $("#error").html("Make sure the CSV has valid numbers for total dance count in the 3rd column.")
                return false;
            }
        }
        return groupAnum; // double this as returning how many As there are...
    }

    // Number of placements submitted
    $("#submit").click(function() {
        actualgroupAnum = validate_csv();
        if (actualgroupAnum) { // MAKE SURE CSV IS VALID
            groupA_num = parseInt($("#groupAnum").val());
            groupBC_num = parseInt($("#groupBCnum").val());
            total_num = groupA_num + groupBC_num;

            // validate total numbers
            if (file_data.length < total_num) {
                $("#error").html("Not enough members to slot--need more signups.")
            } else if (actualgroupAnum < groupA_num) {
                $("#error").html("Not enough A members to fulfill A quota.")
            } else {
                groupC_num = Math.ceil(groupBC_num / 2);
                groupB_num = Math.floor(groupBC_num / 2);

                // sort members by number of dances in ascending order
                ordered_groups = [];
                for (let i = 1; i < file_data.length; i++) { // removing the header
                    current_num = file_data[i][2];
                    current_member = file_data[i]

                    if (ordered_groups.length == 0) { // first dance member
                        ordered_groups.push(current_member);
                    } else { // another dance member to be sorted
                        new_ordered_groups = [];
                        placed = false;
                        for (let j = 0; j < ordered_groups.length; j++) {
                            num = ordered_groups[j][2];
                            mem = ordered_groups[j]
                            if (!placed && num >= current_num) { // place the num
                                new_ordered_groups.push(current_member);
                                new_ordered_groups.push(mem);
                                placed = true;
                            } else if (!placed && j == ordered_groups.length - 1) { // push num to the end if reached end
                                new_ordered_groups.push(mem);
                                new_ordered_groups.push(current_member);
                                placed = true;
                            } else { // just push the rest
                                new_ordered_groups.push(mem);
                            }
                        }
                        ordered_groups = new_ordered_groups
                    }
                }

                
                // get highest A num...
                highestAnum = 0;
                for (let i = 0; i < ordered_groups.length; i++) {
                    if (ordered_groups[i][1] == "A" && ordered_groups[i][2] > highestAnum) {
                        highestAnum = ordered_groups[i][2]; // set highest A dance count
                    } 
                }

                // create group arrays with people's names in ascending order of dances (already ordered)
                groupA = [];
                groupB = [];
                groupC = [];
                sneaky_people = [];
                for (let i = 0; i < ordered_groups.length; i++) {
                    if (ordered_groups[i][1] == "A") {
                        groupA.push(ordered_groups[i]);
                    } else if (ordered_groups[i][1] == "B") {
                        if (ordered_groups[i][2] <= highestAnum) { // only push if not greater than highest A dance count
                            groupB.push(ordered_groups[i]);
                        } else {
                            sneaky_people.push(ordered_groups[i]);
                        }
                    } else if (ordered_groups[i][1] == "C") {
                        if (ordered_groups[i][2] <= highestAnum) { // only push if not greater than highest A dance count
                            groupC.push(ordered_groups[i]);
                        } else {
                            sneaky_people.push(ordered_groups[i]);
                        }
                    }
                }

                // CORRECT SLOTS
                // Start with Group C
                console.log(groupC_num, groupC.length);
                if (groupC_num > groupC.length) { // there are more B spots than members
                    groupB_num += (groupC_num - groupC.length); // push some spots to B
                    groupC_num = groupC.length; // change the spots to fill
                     console.log(groupC_num);
                }

                // Start with Group B
                if (groupB_num > groupB.length) { // there are more B spots than members
                    let extraC = groupC.length - groupC_num;
                    if (extraC > 0) { // check to see if C has any extra members to steal from
                        if (extraC <= groupB_num) { // if extra members doesn't fill the spots
                            groupC_num += extraC; // All C members are drafted in
                            groupB_num -= extraC; // B members lose spot(s)
                        } else if (extraC > groupB_num) { // if there are more extra members than spots needed
                            groupC_num += groupB_num; // all of the B spots are absorbed
                            groupB_num = 0; // no more B spots
                        }
                    }
                    groupA_num += (groupB_num - groupB.length); // push some spots to A
                    groupB_num = groupB.length; // change the spots to fill
                }


                // Start to slot as needed -- by ascending dance count order and then randomization
                // SET GROUPS
                groupC_members = slot(0, groupC_num, groupC, []);
                groupB_members = slot(0, groupB_num, groupB, []);
                groupA_members = slot(0, groupA_num, groupA, []);

                // Back up members
                groupC_backup = slot(groupC_num, groupC.length, groupC, groupC_members)
                groupB_backup = slot(groupB_num, groupB.length, groupB, groupB_members)
                groupA_backup = slot(groupA_num, groupA.length, groupA, groupA_members)
                
                // assign lineup & backups
                lineup_members = groupC_members.concat(groupB_members, groupA_members);
                backup_forA = groupA_backup;
                backup_forB = groupB_backup.concat(groupC_backup, groupA_backup, sneaky_people);
                backup_forC = groupC_backup.concat(groupB_backup, groupA_backup, sneaky_people);

                // POPULATE TABLE
                // set up headers
                var text = '<tr><th></th>';
                for (let i = 0; i < total_num; i++) { // how many slots needed is going to dictate how many columns
                    text += '<th>Member #';
                    text += i + 1;
                    text += '</th>';
                } 
                text += '</tr>'

                // fill in the rest of the table
                for (let i = 0; i < backup_forC.length + 1; i++) { // longest backup dancer list is going to dictate how many rows
                    // set up column header
                    text += '<tr>';
                    if (i == 0) { // member assignment
                        text += '<td>LINEUP</td>';
                    } else { // backup
                        text += '<td>Backup #';
                        text += i;
                        text += '</td>';
                    }

                    // how many slots needed is going to dictate how many columns
                    for (let j = 0; j < total_num; j++) { 
                        text += '<td>';
                        if (i == 0) { // actual lineup member
                            text += lineup_members[j][0];
                            text += '</td>'
                        } else { // backup member
                            lineup_member_group = lineup_members[j][1];
                            if (lineup_member_group == 'A') {
                                if (i - 1 < backup_forA.length) {
                                    text += backup_forA[i - 1][0];
                                } else {
                                    text += '-'
                                }
                                text += '</td>' 
                            } else if (lineup_member_group == 'B') {
                                if (i - 1< backup_forB.length) {
                                    text += backup_forB[i - 1][0];
                                } else {
                                    text += '-'
                                }
                                text += '</td>' 
                            } else if (lineup_member_group == 'C') {
                                if (i - 1 < backup_forC.length) {
                                    text += backup_forC[i - 1][0];
                                } else {
                                    text += '-'
                                }
                                text += '</td>' 
                            }
                        }    
                    } 
                    text += '</tr>';
                }
                $("#results").html(text);

            }

        }
        
    });

});

