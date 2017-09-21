from __future__ import print_function
import pprint
import io
import os
import re

import urllib.request
import urllib.response
import html
import json
import ast
import time
import datetime
import requests
from requests.auth import HTTPBasicAuth

from apiclient import http
from apiclient import errors
from apiclient.http import MediaIoBaseDownload
from apiclient import discovery

from oauth2client import client
from oauth2client.client import flow_from_clientsecrets
from oauth2client.client import OAuth2WebServerFlow
from oauth2client import tools
from oauth2client.file import Storage
from oauth2client.service_account import ServiceAccountCredentials

from PIL import Image
from mimetypes import MimeTypes
import praw
import httplib2
from httplib2 import Http

from pymongo import MongoClient
MONGO_CLIENT = MongoClient("mongodb://localhost:27017")
MONGO_DB = MONGO_CLIENT.MTurkStudies
MONGO_DB_NAME = "dec15"
MONGO_COLL_SOURCE = MONGO_DB[MONGO_DB_NAME]

import boto3
AWS_S3 = boto3.resource('s3')

# CONNECT TO GOOGLE DRIVE API
SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file'
CLIENT_SECRET_FILE = 'client_secret.json'
APPLICATION_NAME = 'photoshopRequest'
API_KEY = 'AIzaSyCcB1vli7M3cN_p7R8FCqhRJrGQH_CzBwY'
DRIVE_CLIENT_ID = '378538169345-ftj0hmrmfup4v0edr6kv2nfm14ps0ml9.apps.googleusercontent.com'
DRIVE_CLIENT_SECRET = '03B8fMTScxc8UMP--8Wqaf2l'
FLOW = OAuth2WebServerFlow(client_id=DRIVE_CLIENT_ID, client_secret=DRIVE_CLIENT_SECRET, scope=SCOPES, redirect_uri='http://localhost:8080', user_agent='/Vivien_Drive_UA')


def get_credentials():
    """Gets valid user credentials from storage.
    If nothing has been stored, or if the stored credentials are invalid,
    the OAuth2 flow is completed to obtain the new credentials.
    Returns:
        Credentials, the obtained credential.
    """
    home_dir = os.path.expanduser('~')
    credential_dir = os.path.join(home_dir, '.credentials')
    if not os.path.exists(credential_dir):
        os.makedirs(credential_dir)
    credential_path = os.path.join(credential_dir,
                                   'drive-python-quickstart.json')

    store = Storage(credential_path)
    credentials = store.get()
    if not credentials or credentials.invalid:
        flow = client.flow_from_clientsecrets(CLIENT_SECRET_FILE, SCOPES)
        flow.user_agent = APPLICATION_NAME
        if flags:
            credentials = tools.run_flow(flow, store)
        else: # Needed only for compatibility with Python 2.6
            credentials = tools.run(flow, store)
        print('Storing credentials to ' + credential_path)
    return credentials


# PRAW API

USER_AGENT = "/desktop:1Om-zQfC0dbHMw:1.2.0 (by/u/vchen601)"
DB_DIR = "/Users/vchen/Desktop/DB_photoshop-request"

WEB_APP_ID = '1Om-zQfC0dbHMw'
WEB_APP_SECRET = 'PXaXhiSe53wXz5zO4RURMR_k8QE'
REDDIT = praw.Reddit(client_id=WEB_APP_ID,
                     client_secret=WEB_APP_SECRET,
                     user_agent=USER_AGENT)

credentials = get_credentials()
http = credentials.authorize(httplib2.Http())
DRIVE_SERVICE = discovery.build('drive', 'v3', http=http, developerKey=API_KEY)

def record_error(link_url, error):
    ''' Record image url & error type in 'hairycases.txt' '''
    error_file = "/Users/vchen/Desktop/photoshop-request/redditCrawler/hairycases.txt"
    current_time = strftime("%Y-%m-%d %H:%M:%S", gmtime())
    with open(error_file, "r+") as annotate_file:
        for line in annotate_file:
            if link_url in line:
                return

        record = link_url + " : " + str(error) + " || " + current_time
        annotate_file.write(record)
        annotate_file.write('\n')
        annotate_file.close()


def is_meta(title):
    ''' Check if submission is [META]'''
    match_obj = re.search(r"\[META\]", title, re.I|re.M)
    return match_obj != None

def is_img_link(url):
    ''' Check if given url goes directly to a .jpg/.png/.jpeg.  Return boolean '''
    match_obj = re.search(r"\.jpg$|\.jpeg$|\.png$", url, re.I|re.M)
    return match_obj != None

def is_imgur_link(url):
    ''' Check if given url is imgur link.  Return boolean '''
    match_obj = re.match(r"https?://m?i?.?imgur.com/", url, re.I)
    return match_obj != None

def is_imgur_album(url):
    '''Check if url is imgur album.  Return boolean'''
    match_obj = re.match(r"https?://m?i?.?imgur.com/a/", url, re.I)
    return match_obj != None

def is_imgur_gallery(url):
    '''Check if url is imgur gallery.  Return boolean'''
    match_obj = re.match(r"https?://m?i?.?imgur.com/gallery/", url, re.I)
    return match_obj != None

def get_imgur_album_id(url):
    '''Get imgur album ID'''
    album_indicator = ('/a/')
    beg_index = url.index(album_indicator) + len(album_indicator)
    album_id = url[beg_index:]
    return album_id

def get_imgur_gallery_id(url):
    '''Get imgur gallery ID'''
    gallery_indicator = ('/gallery/')
    beg_index = url.index(gallery_indicator) + len(gallery_indicator)
    gallery_id = url[beg_index:]
    return gallery_id

def is_pr_submission(url):
    ''' Check if given url is reddit photoshop submission post '''
    match_obj = re.match(r"https?://www.reddit.com/r/PhotoshopRequest/comments/", url, re.I)
    return match_obj != None

def is_reddit_user(url):
    ''' Check if given url is link to reddit user '''
    match_obj = re.match(r"/u/", url, re.I)
    return match_obj != None

def is_subreddit(url):
    ''' Check if given url is reddit photoshop submission post '''
    match_obj = re.match(r"https?:/r/", url, re.I)
    return match_obj != None


def is_broken_imgur(url):
    '''Check if url is broken non-album non-gallery imgur link
    (ex. 'http://imgur.com/123', instead of 'http://imgur.com/123.jpg')'''

    # Doesn't have .jpg or .png extension
    has_extension = is_img_link(url)
    if has_extension:
        return False

    # Starts with imgur.com
    if not is_imgur_link(url):
        return False

    # Check is an album
    if is_imgur_album(url):
        return False

    # Check is a gallery
    if is_imgur_gallery(url):
        return False

    return True

def is_drive(url):
    '''Check if url is Drive link'''
    match_obj = re.match(r"https?://drive.google.com", url, re.I)
    return match_obj != None

def get_drive_id_type(url):
    '''Given drive link, return drive_id and type'''

    # If folder
    if url.find('/folders/') > -1:
        response_id_type = "folder"
        folder_indicator = '/folders/'
        beg_index = url.index(folder_indicator) + len(folder_indicator)
        # ex. '...drive.google.com/drive/folders/ID/'
        if url[beg_index:].find('/') > -1:
            end_index = url[beg_index:].index('/') + beg_index
            drive_id = url[beg_index: end_index]

        # ex. '...drive.google.com/drive/folders/ID?usp=sharing'
        elif url[beg_index:].find('?usp=sharing') > -1:
            end_index = url[beg_index:].index('?usp=sharing') + beg_index
            drive_id = url[beg_index: end_index]

        else:
            drive_id = url[beg_index:]

    # ex. '...drive.google.com/folderview?id=ID&usp=sharing'
        if url.find('/folderview?id=') > -1:
            response_id_type = "file"
            folder_indicator = '/folderview?id=/'
            beg_index = url.index(folder_indicator) + len(folder_indicator)
            if url[beg_index:].find('?usp=sharing') > -1:
                end_index = url[beg_index:].index('?usp=sharing') + beg_index
                drive_id = url[beg_index: end_index]
            else:
                drive_id = url[beg_index:]
        return(drive_id, response_id_type)
        
    # If file
    if url.find('/file/') > -1:
        response_id_type = "file"
        file_indicator = '/d/'
        beg_index = url.index(file_indicator) + len(file_indicator)

        if url[beg_index:].find('/') > 1:
            end_index = url[beg_index:].index('/') + beg_index
            drive_id = url[beg_index: end_index]
        else:
            drive_id = url[beg_index:]
        return(drive_id, response_id_type)

    # If other
    if url.find('/open?') > -1:
        response_id_type = "other"
        indicator = 'id='
        beg_index = url.find(indicator) + len(indicator)
        if url[beg_index:].find('/') > -1:
            end_index = url[beg_index:].index('/') + beg_index
            drive_id = url[beg_index: end_index]
        else:
            drive_id = url[beg_index:]
        return(drive_id, response_id_type)

def download_drive_file(file_id, destination, image_name):
    '''Given drive ID, download locally to destination path (includes filename).
    Return table with image info (name, width, height)'''

    image_info = {}
    print("file_id: " + file_id)
    # Attempt image download
    try:
        request = DRIVE_SERVICE.files().get_media(fileId=file_id)
        file_bytes = io.BytesIO()
        downloader = MediaIoBaseDownload(file_bytes, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
            print("Download %d%%." % int(status.progress() * 100))

    except Exception as err:
        print('error downloading drive file')
        print(err)

    # Check image type
    try:
        img_bytestes = downloader._fd
        image = Image.open(img_bytestes)
        image.save(destination + "/" + image_name)
        image_info["name"] = image_name
        image_info["width"] = image.size[0]
        image_info["height"] = image.size[1]
        print("Downloading drive file as " + str(image_info))

    except Exception as err:
        print('file not an image')
        print(err)
        image_info = "invalidImage"
    return image_info



def handle_drive_folder(drive_id, destination, image_id, downloaded_imgs, table_result, link_url):
    ''' Given Google Drive Folder, download all files in folder to destination '''

    url = "https://www.googleapis.com/drive/v2/files"
    search_query = "'" + drive_id + "'" + " in parents"
    querystring = {"q": search_query, "key": API_KEY}

    response = requests.request("GET", url, params=querystring)

    all_info = json.loads(response.text)
    files = all_info["items"]
    num_files = len(files)

    for j in range(0, num_files):
        file_id = (files[j]["id"])
        direct_img = files[j]["title"]
        file_extension_index = direct_img.rfind('.')
        extension = direct_img[file_extension_index:]

        if downloaded_imgs+j == 0:
            img_name = image_id + extension
        else:
            img_name = image_id + "_" + str(downloaded_imgs + 1) + "_" + str(j) + extension

        img_info = download_drive_file(file_id, destination, img_name)

        if img_info != "invalidImage":
            table_result[link_url] = img_info

def handle_drive_file(drive_id, destination, image_id, downloaded_imgs, j, link_url):
    ''' Given Google Drive File, download to destination '''

    if downloaded_imgs+j == 0:
        img_name = image_id + '.jpg'
    else:
        img_name = image_id + str(downloaded_imgs+1) + "_" + str(j) +'.jpg'
    try:
        img_info = download_drive_file(drive_id, destination, img_name)
    except Exception as err:
        print("Error downloding drive file " + link_url)
        img_info = "invalidImage"
        record_error(link_url, err)
    return img_info

def is_dropbox(url):
    '''Check if dropbox url'''
    match_obj = re.match(r"https?://www.dropbox.com/", url, re.I)
    return match_obj != None

def get_db_type(url):
    '''Given db link, return type'''
    for share_type in "/s/", "/sh/":
        print("Trying type " + share_type)
        match_obj = re.match(r"https?://www.dropbox.com"+share_type, url, re.I)
        if match_obj != None:
            break
    if share_type == "/s/":
        db_type = "file"
    if share_type == "/sh/":
        db_type = "folder"

    return db_type

def db_downloadable(url):
    ''' Transform dropbox link into downloadable type by changing trailing end to dl=1'''
    file_extension_index = url.rfind('.')
    q_indicator = '?'
    q_index = url[file_extension_index:].find(q_indicator)
    downloadable = 'dl=1'
    return_url = url[:file_extension_index + q_index] + q_indicator + downloadable
    print("fixed " + url + " to " + return_url)
    return return_url

def handle_db_folder(url):
    ''' Iterate thru all images in DB Folder and download '''
    print("handle db folder")

def urllib_download(link_url, destination, img_name):
    ''' Call on SINGLE image links can be downloaded via urllib:
    That is, images that are not hosted on Google Drive or Dropbox'''
    print("calling direct download on " + link_url + " to " + destination + " under " + img_name)
    img_info = {}
    urllib.version = 'Desktop Vivien 625 Use'

    # Attempt download
    try:
        urllib.request.urlretrieve(link_url, destination + "/" + img_name)
    except Exception as err:
        print(err)
        print("!!! Error downloading")
        img_info = 'invalidImage'
        return img_info

    # Check if image
    try:
        img = Image.open(destination+"/"+img_name)
        img_info["name"] = img_name
        img_info["width"] = img.size[0]
        img_info["height"] = img.size[1]
        print("downloaded: " + str(img_info))
    except Exception as err:
        print(err)
        print("!!! Not image file")
        img_info = 'invalidImage'
        if os.path.isfile(destination + "/" + img_name):
            os.remove(destination + "/" + img_name)

    return img_info

def reset_count_link(count_file):
    ''' Reset contents of file counting link types'''
    with open(count_file, "r") as json_file:
        data = json.load(json_file)

        for key in data.keys():
            if key == "Other":
                data[key] = {"count":0, "table":[]}
            else:
                data[key] = 0

    with open(count_file, "w") as json_file:
        json_file.write(json.dumps(data))


def count_link(count_file, image_type, link_url, sub_id):
    ''' Count link types and breakdowns'''
    if is_pr_submission(link_url) or is_reddit_user(link_url) or is_subreddit(link_url):
        return

    with open(count_file, "r") as json_file:
        data = json.load(json_file)
        data["Total"] += 1

        if image_type == "Other":
            data["Other"]["count"] += 1
            new_content = link_url + " | " + sub_id
            data["Other"]["table"].append(new_content)
        else:
            data[image_type] += 1

    with open(count_file, "w") as json_file:
        json_file.write(json.dumps(data))


# If link_url refers to a FOLDER, it will record inner links to table_result in direct_download.  Returns 'invalidImage'
# If link_url refers to a DIRECT IMAGE, it will return img_info dictionary
def direct_download(link_url, destination, id_type, image_id, downloaded_imgs, table_result, sub_id):
    ''' Handle direct image download.  Returns "img_info" '''
    img_info = "invalidImage"
    client_id = "37dc0b4e676ca0d"
    headers = {"authorization": "Client-ID " + client_id}

    count_file = "/Users/vchen/Desktop/photoshop-request/redditCrawler/count_links.json"

    if is_pr_submission(link_url) or is_reddit_user(link_url) or is_subreddit(link_url):
        return img_info

    # Check and fix broken links to non-album non-gallery imgur URLs
    if is_broken_imgur(link_url):
        link_url += ".jpg"
        print("Just fixed link to: " + link_url)

    file_extension_index = link_url.rfind('.')
    extension = link_url[file_extension_index:]

    if is_img_link(link_url):
        if downloaded_imgs == 0:
            img_name = image_id + extension
        else:
            img_name = image_id + "_" + str(downloaded_imgs+1) + extension

        count_link(count_file, "Direct", link_url, sub_id)
        img_info = urllib_download(link_url, destination, img_name)
        return img_info

    if is_imgur_album(link_url):
        print("*** IMGUR ALBUM ***" + link_url)
        count_link(count_file, "ImgurAlb", link_url, sub_id)

        try:
            # Check imgur album/gallery
            album_id = get_imgur_album_id(link_url)
            url = "https://api.imgur.com/3/album/" + album_id + "/images"
            response = requests.request("GET", url, headers=headers)
            image_data = json.loads(response.text)["data"]

            # Download images within album
            num_links = len(image_data)
            for j in range(0, num_links):
                direct_img = image_data[j]["link"]
                file_extension_index = direct_img.rfind('.')
                extension = direct_img[file_extension_index:]

                if downloaded_imgs+j == 0:
                    img_name = image_id + extension
                else:
                    img_name = image_id + "_" + str(downloaded_imgs + 1) + "_" + str(j) + extension

                img_info = urllib_download(direct_img, destination, img_name)
                table_result[direct_img] = img_info

        except Exception as err:
            print("Err with getting album ID")
        return "invalidImage"

    if is_imgur_gallery(link_url):
        print("*** IMGUR GALLERY ***" + link_url)
        count_link(count_file, "ImgurGall", link_url, sub_id)

        gall_id = get_imgur_gallery_id(link_url)
        url = "https://api.imgur.com/3/gallery/album/" + gall_id
        try:
            response = requests.request("GET", url, headers=headers)
            image_data = json.loads(response.text)["data"]["images"]
            num_images = len(image_data)
            print("num_images: " + str(num_images))

            for j in range(0, num_images):
                direct_img = image_data[j]["link"]

                # Check and fix broken links to non-album imgur URLs
                if is_broken_imgur(direct_img):
                    direct_img += ".jpg"
                    print("Just fixed link to: " + direct_img)

                # If url ends in jpg or png: download image
                if is_img_link(direct_img):
                    file_extension_index = direct_img.rfind('.')
                    extension = direct_img[file_extension_index:]
                    print("extension: " + extension)

                    if downloaded_imgs+j == 0:
                        img_name = image_id + extension
                    else:
                        img_name = image_id + "_" + str(downloaded_imgs+1) + "_" + str(j) + extension

                    table_result[direct_img] = urllib_download(direct_img, destination, img_name)
            return "invalidImage"

        except Exception as err:
            return "invalidImage"


    # Google Drive Images
    if is_drive(link_url):
        print("*** GOOGLE DRIVE ***")
        id_type = get_drive_id_type(link_url)
        drive_id = id_type[0]
        drive_type = id_type[1]
        print("ID: " + str(drive_id))
        print("Type: " + str(drive_type))
        # Folder
        if drive_type == "folder":
            count_link(count_file, "DriveFolder", link_url, sub_id)
            handle_drive_folder(drive_id, destination, image_id, downloaded_imgs, table_result, link_url)

        # Single File
        elif drive_type == "file":
            count_link(count_file, "DriveFile", link_url, sub_id)
            img_info = handle_drive_file(drive_id, destination, image_id, downloaded_imgs, 0, link_url)
            return img_info

        #Unknown other
        elif drive_type == "other":
            print("Unknown type")
            for handle in handle_drive_file, handle_drive_folder:
                try:
                    if handle == handle_drive_file:
                        count_link(count_file, "DriveFile", link_url, sub_id)
                        img_info = handle(drive_id, destination, image_id, downloaded_imgs, 0, link_url)
                    if handle == handle_drive_folder:
                        count_link(count_file, "DriveFolder", link_url, sub_id)
                        handle(drive_id, destination, image_id, downloaded_imgs, table_result, link_url)

                except Exception as err:
                    print(err)
                    print("!!! drive other error")
                    continue


    # Dropbox Images
    if is_dropbox(link_url):
        print("*** DROPBOX ***" + link_url)
        db_type = get_db_type(link_url)
        if db_type == "folder":
            print("UNRESOLVED db folder")
            count_link(count_file, "DBFolder", link_url, sub_id)

        if db_type == 'file':
            count_link(count_file, "DBFile", link_url, sub_id)
            # Make dropbox link downloadable by changing ending to dl=1
            try:
                fixed_url = db_downloadable(link_url)
                file_extension_index = fixed_url.rfind('.')
                q_index = fixed_url[file_extension_index:].find('?')
                extension = fixed_url[file_extension_index:file_extension_index + q_index]
                img_info = urllib_download(fixed_url, destination, image_id + extension)
            except Exception as err:
                print(err)
                print("!!! downloading dropbox error")
                record_error(link_url, err)


    # Download link, return name of downloaded image.
    # If image could not be downloaded, return "invalidImg"
    if (not is_img_link(link_url)) and (not is_imgur_album(link_url)) and (not is_imgur_gallery(link_url)) and (not is_drive(link_url)) and (not is_dropbox(link_url)):
        count_link(count_file, "Other", link_url, sub_id)
        img_info = urllib_download(link_url, destination, image_id+'.jpg')
        print("saving other link as " + str(img_info))
    
    return img_info


def handle_images(content, destination, id_type, index, image_table, sub_id):
    '''Searches for valid images within content to save to destination
     id_type = 0: download images for source, passing in HTML as content.  Save as "SOURCE.jpg", "SOURCE_1.jpg", etc
     id_type = 1: download images for comments, passing in comment object as content.  Save as "<commentID>.jpg", "<commentID>_1.jpg", etc
     Return dictionary of url:img_infoPath
    '''
    if id_type == 'SOURCE':
        image_id = 'SOURCE'
    if id_type == 'COMMENT':
        image_id = content.id
        content = content.body_html

    table_result = {}
    num_links = content.count("<a href=")
    #print("Number of links: " + str(num_links))

    # Loop thru all links
    for i in range(0, num_links):
        link_indicator = '<a href="'
        link_index = content.find(link_indicator)
        new_beginning = link_index + len(link_indicator)
        url_start = content[new_beginning:]
        url_end = url_start.find('">')
        link_url = content[new_beginning:new_beginning+url_end]
        print("Found link: " + link_url)
        img_info = "invalidImage"

        if link_url in image_table:
            print("Already seen this link")
            continue

        # If we haven't already saved and recorded this image, download it
        if link_url not in image_table:
            # If link_url refers to a FOLDER, it will record inner links to table_result in direct_download.  Returns 'invalidImage'.  Does not need to be further recorded.
            # If link_url refers to a DIRECT IMAGE, it will return img_info dictionary and need to be recorded here.
            img_info = direct_download(link_url, destination, id_type, image_id, index+i, table_result, sub_id)

        if img_info != "invalidImage":
            table_result[link_url] = img_info

        # Move to next link
        content = content[new_beginning+url_end:]
        print("\n")
    return table_result


def to_mongo(submission_id):
    print("calling to_mongo")
    ''' Upload images to AmTurk bucket, edit JSON'''
    photo_bucket = AWS_S3.Bucket('cil-intern-vchen')
    mime = MimeTypes()

    submission_folder = DB_DIR + '/' + submission_id

    if os.path.isdir(submission_folder):
        submission_json = submission_folder + '/raw.json'
        edit_json = open(submission_json, "r+")
        img_table = json.load(edit_json)["table"]

        # See if there is at least one SOURCE and RESPONSE images in JSON
        has_source = False
        has_response = False
        source_valid_size = True

        for value in list(img_table.values()):
            if value == "invalidImage":
                continue
            image_name = value["name"]
            image_height = value["height"]
            image_width = value["width"]
            if "SOURCE" in image_name:
                has_source = True
                if (image_height < 200) or (image_width < 200):
                    source_valid_size = False
            else:
                has_response = True

        # Don't process and return if:
        # - this post has no source images, 
        # - its source images are too small
        # - it has no response images
        '''
        print("has source: " + str(has_source))
        print("source valid size (default True) : " + str(source_valid_size))
        print("has response: " + str(has_response))
        '''
        if (not has_source) or (has_source and not source_valid_size) or (not has_response):
            return
        
    # Upload images to AmTurk bucket
        # Create folder in AmTurk
        make_folder = photo_bucket.put_object(Key=submission_id + "/", Body='')
        print(make_folder)

        # Put files in folder
        submission_files = os.listdir(submission_folder)
        for file in submission_files:
            extension = os.path.splitext(file)[1]
            if extension != ".json":
                image_file = submission_folder+"/"+file
                mime_type = mime.guess_type(image_file)[0]
                print(file)
                with open(image_file,"rb") as f:
                    put_image = photo_bucket.upload_fileobj(f, submission_id+"/"+file, ExtraArgs={'ACL':'public-read','ContentType':mime_type})
    #Make new JSON
    submission_json = submission_folder + '/raw.json'
    edit_json = open(submission_json, "r+")
    new_json = json.load(edit_json)
    edit_json.close()

    #Edit JSON
    img_table = new_json["table"]

    for key in list(img_table.keys()):
        # Ignore "invalidImage"
        if img_table[key] == "invalidImage":
            del img_table[key]

    for key in list(img_table.keys()):
        # original_url : name
        img_table_value = img_table[key]
        name = img_table[key]['name']
        amazon_url = "https://s3-us-west-1.amazonaws.com/cil-intern-vchen/" + submission_id + "/" + name
        dot_index = name.rfind(".")
        new_name = name[:dot_index]
        img_table[amazon_url] = new_name

    # Remove non-amazon urls
    for k in list(img_table.keys()):
        if (img_table[k] == "invalidImage") or (not (k.startswith("https://s3-us-west-1.amazonaws.com/cil-intern-vchen/"))):
            del img_table[k]

    res = {v:k for k,v in img_table.items()}

    new_json["table"] = res
    # Add responses key
    new_json["study1Responses"] = 0
    new_json["study2Responses"] = 0
    new_json["study3Responses"] = 0

    # Send to mongo
    result = MONGO_COLL_SOURCE.insert_one(new_json)
    print(result)

def process_submission(submission_id):
    '''Create submission folders, process submission comments, load JSON with relevant data'''
    print("======SUBMISSION " + str(submission_id) + "=========")
    submission = REDDIT.submission(submission_id)

    # Check if we've already parsed this post
    first_parse = True
    submission_folder = DB_DIR + '/' + submission_id

    if os.path.isdir(submission_folder):
        first_parse = False
        submission_json = submission_folder + '/raw.json'
        edit_json = open(submission_json, "r+")

    if first_parse:
        os.mkdir(submission_folder)
        submission_json = submission_folder + '/raw.json'
        edit_json = open(submission_json, "w+")

    # Create JSON within folder
    if not first_parse:
        print("we've been here b4")
        data = json.load(edit_json)
        all_images = data["table"]

    if first_parse:
        # Populate JSON
        data = {}
        data["id"] = submission.id
        data["title"] = submission.title
        data["url"] = submission.url

        data["content"] = html.escape(submission.selftext)
        data["table"] = []
        all_images = {}

    # Download images from source (submission url). Record url:img if available.
    print("SOURCE IMAGE")
    # Download source images if it's a NEW image 
    #(the first time we're parsing, or the link differs from the original submission.url)
    if first_parse or data["url"] != submission.url:
        if is_broken_imgur(submission.url):
            submission.url += ".jpg"
            print("Just fixed link to: " + submission.url)

        if is_pr_submission(submission.url):
            img_info = "invalidImage"
        else:
            # If link_url refers to a FOLDER, it will record inner links to table_result in direct_download.  Returns 'invalidImage'.  Does not need to be further recorded.
            # If link_url refers to a DIRECT IMAGE, it will return img_info folder and may need to be recorded here.
            img_info = direct_download(submission.url, submission_folder, 'SOURCE', 'SOURCE', 0, all_images, submission.id)

        if img_info != "invalidImage":
            all_images[submission.url] = img_info

    print("\n")

    #Download images from source (body text)
    print("SOURCE BODY TEXT")
    if not first_parse:
        source_body_results = all_images
    else:
        source_body_results = {}

    # Try/except in case of null source.selfText and return dictionary of url:img relationship
    try:
        response = requests.request("GET", submission.url + '.json')
        json_res = json.loads(response.text)
        selftext_html = json_res[0]['data']['children'][0]['data']['selftext_html']

        # Merge results from source.selfText with all_images
        new_source_body_results = handle_images(html.unescape(selftext_html), submission_folder, 'SOURCE', len(all_images), source_body_results, submission.id)

        all_images.update(new_source_body_results)

    except Exception as err:
        print(err)

    print("\n")
    print("FROM COMMENTS")

    # Download comment images and return dictionary of url:img relationship
    new_comments = {}
    if not first_parse:
        comment_results = all_images
    else:
        comment_results = {}

    submission.comments.replace_more(limit=0)
    comment_list = submission.comments.list()
    for comment in comment_list:
        # Ignore comments by automoderator & other bots
        if (comment.author == 'AutoModerator') or (comment.author == 'imguralbumbot') or (comment.author == 'redditBotColorize') or (comment.author == 'colorizebot2'):
            continue
        # Merge results from comments
        new_single_comment_results = handle_images(comment, submission_folder, 'COMMENT', 0, comment_results, submission.id)
        new_comments.update(new_single_comment_results)
    
    # Merge results from (new) comments with allImages
    all_images.update(new_comments)

    # Save JSON table value as allImages
    data["table"] = all_images

    edit_json.truncate(0)
    edit_json.close()
    
    edit_json = open(submission_json, "r+")

    edit_json.write(json.dumps(data))

    edit_json.close()

# Check if database already contains this mongo file
def new_mongo(submissionID):
    document_exists = MONGO_COLL_SOURCE.find_one({"id":submissionID})
    print(document_exists)
    if document_exists == None:
        return True

def load_posts_between(old_timestamp, new_timestamp):
    old_time = time.strftime("%m-%d-%Y %H:%M", time.gmtime(int(old_timestamp)))
    new_time = time.strftime("%m-%d-%Y %H:%M", time.gmtime(int(new_timestamp)))
    print("Getting posts between " + old_time + " and " + new_time + " to " + MONGO_DB_NAME)
    '''Load and process submissions between two timestamps'''
    subreddit = REDDIT.subreddit('photoshoprequest')
    query_timestamp = "timestamp:" + old_timestamp + ".." + new_timestamp
    submission_list = subreddit.search(query_timestamp, sort="new", syntax='cloudsearch', limit=None)
    
    for submission in submission_list:
        print(submission.title)
        submission_folder = DB_DIR + '/' + submission.id
        # Don't process META, RANDOM or NSFW posts // OR FOR THIS CURRENT CRAWLING:: DON'T PROCESS ALREADY PROCESSED STUFF!!
        if is_meta(submission.title) or submission.over_18 or (os.path.isdir(submission_folder)):
            continue
        process_submission(submission.id)
        if new_mongo(submission.id):
            to_mongo(submission.id)  
        print("\n") 


                    # crawler handles most recent posts firsts
# DOWNLOADING:     2015: dec 1 - 31
#load_posts_between("1448928000","1451606399")
#to_mongo("6i824e")
submission = REDDIT.submission(id='6fs2pe')
submission_folder = DB_DIR + '/' + submission.id
process_submission(submission.id)
if new_mongo(submission.id):    
    print("new mongo eh")        
    to_mongo(submission.id)


